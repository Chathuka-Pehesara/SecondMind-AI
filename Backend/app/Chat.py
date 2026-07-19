from fastapi import HTTPException
from fastapi.types import DependencyCacheKey
import os
import json
import uuid
import datetime
import asyncio
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import google.generativeai as genai

from app.database import get_db, sessionLocal
from app.models import User, Conversation, Message
from app.schemas import ConversationResponse, MessageResponse, MessageCreate
from app.auth import get_current_user
from app.models import Document

router = APIRouter(prefix="/chat", tags=["chat"])

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key = GEMINI_API_KEY)
else:
    print("WARNING: GEMINI_API_KEY env variable is missing. Streaming will fail untl configured.")

# Support system instruction in model configuration
def get_gemini_model(system_instruction: str = None):
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail = "Gemini API key is not configured on the server"
        )

    return genai.GenerativeModel("gemini-2.5-flash", system_instruction=system_instruction)

async def generate_gemini_stream (conversation_id: str, prompt_content: str, user_id: int): # [MODIFIED ARGUMENTS]

    db = sessionLocal()
    try:
        # Retrieve context from user memory
        from app.memory import get_user_memory_context
        memory_context = get_user_memory_context(db, user_id)

        docs = db.query(Document).filter(Document.conversation_id == conversation_id).all()
        
        citations = []
        confidence_score = 0.0
        system_instruction = memory_context if memory_context else ""
        
        # If RAG files are found, perform similarity search
        if docs:
            from app.rag import retrieve_rag_context
            retrieved_chunks, conf_score = retrieve_rag_context(conversation_id, prompt_content)
            confidence_score = conf_score
            
            if retrieved_chunks:
                # Compile unique document citations
                citations = list(set([chunk["filename"] for chunk in retrieved_chunks]))
                
                # Format document contexts
                context_str = "\n\n".join([
                    f"--- Source: {chunk['filename']} ---\n{chunk['text']}"
                    for chunk in retrieved_chunks
                ])
                
                rag_instruction = (
                    "You are a helpful AI assistant backed by a Retrieval-Augmented Generation (RAG) system.\n"
                    "Your primary instruction is to answer the user query based ONLY on the provided context source blocks.\n"
                    "If the context does not contain relevant details to address the query, state: 'I cannot find the answer in the provided documents.'\n"
                    "Always mention citations when referring to specific files (e.g. [filename.pdf]).\n\n"
                    f"Document Context:\n{context_str}"
                )
                
                if system_instruction:
                    system_instruction = f"{system_instruction}\n\n{rag_instruction}"
                else:
                    system_instruction = rag_instruction
        
        db_messages = db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.created_at.asc()).all()

        # Format history for Gemini API
        gemini_history = []
        for msg in db_messages:
            role = "user" if msg.role == "user" else "model"
            gemini_history.append({
            "role": role,
            "parts": [{"text": msg.content}]
            })
        
        # Inject memory context as system instructions
        model = get_gemini_model(system_instruction=system_instruction if system_instruction else None)
        loop = asyncio.get_event_loop()

        def stream_call():
            return model.generate_content(contents=gemini_history, stream=True)
        
        response_stream = await loop.run_in_executor(None, stream_call)

        full_response_text = ""
        for chunk in response_stream:
            if chunk.text:
                full_response_text += chunk.text
                yield f"data: {json.dumps({'text': chunk.text})}\n\n"
                await asyncio.sleep(0.01)
        
        new_message = Message(
            conversation_id=conversation_id,
            role="model",
            content=full_response_text
        )
        db.add(new_message)

        conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if conversation and conversation.title == "New Chat":
            title_text = prompt_content[:35] + ("..." if len(prompt_content) > 35 else "")
            conversation.title = title_text
            db.add(conversation)

        db.commit()

    except Exception as e:
        error_msg = f"Error during generation: {str(e)}"
        print(error_msg)
        yield f"data: {json.dumps({'error': error_msg})}\n\n"
    finally:
        db.close()

@router.post("/conversations", response_model=ConversationResponse)
def create_conversation(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conversation_id =  str(uuid.uuid4())
    new_conversation =  Conversation(
        id  = conversation_id,
        user_id = current_user.id,
        title = "New Chat"
    )
    db.add(new_conversation)
    db.commit()
    db.refresh(new_conversation)
    return new_conversation

@router.get("/conversations", response_model=List[ConversationResponse])
def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Conversation).filter(
        Conversation.user_id == current_user.id
    ).order_by(Conversation.updated_at.desc()).all()


@router.delete("/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db:Session =  Depends(get_db)
):
    
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    db.delete(conversation)
    db.commit()
    return {"Message": "Conversation deleted successfully"}

@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
def get_messages(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session =  Depends(get_db)
):
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.created_at.asc()).all()


@router.post("/conversations/{conversation_id}/message/stream")
def send_message_stream(
    conversation_id: str,
    msg_in: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Save message to database
    conversation.updated_at = datetime.datetime.utcnow()
    db.add(conversation)

    # Save user message to database
    user_message = Message(
        conversation_id=conversation_id,
        role="user",
        content=msg_in.content
    )
    db.add(user_message)
    db.commit()

    return StreamingResponse(
        generate_gemini_stream(conversation_id, msg_in.content, current_user.id), media_type="text/event-stream" # [PASSED USER ID]
    )

@router.post("/conversations/{conversation_id}/regenerate")
def regenerate_response(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.created_at.desc()).all()

    if not messages:
        raise HTTPException(status_code=404, detail="No messages found in this conversation")
    
    last_msg = messages[0]
    if last_msg.role == "model":
        db.delete(last_msg)
        db.commit()
        last_user_msg = messages[1] if len(messages) > 1 else None
    else:
        last_user_msg = last_msg
    
    if not last_user_msg or last_user_msg.role != "user":
        raise HTTPException(status_code=404, detail="Last source message must be from user to regenerate")

    return StreamingResponse(
        generate_gemini_stream(conversation_id, last_user_msg.content, current_user.id), media_type="text/event-stream" # [PASSED USER ID]
    )
