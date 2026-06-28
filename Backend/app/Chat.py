from fastapi import HTTPException
from fastapi.types import DependencyCacheKey
import os
import json
import uuid
import datetime
import asyncio
from typing import List
from fastapi import APIRouter, Depends, HHTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import google.generativeai as genai

from app.database import get_db, sessionLocal
from app.models import User, Conversation, Message
from app.schemas import ConversationResponse, MessageResponse, MessageCreate
from app.auth import get_current_user

router = APIRouter(prefix="/chat", tags=["chat"])

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key = GEMINI_API_KEY)
else:
    print("WARNING: GEMINI_API_KEY env variable is missing. Streaming will fail untl configured.")

def get_gemini_model():
    if not GEMINI_API_KEY:
        raise HHTPException(
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail = "Gemini API key is not configured on the server"
        )

    return genai.GenerativeModel("gemini-1.5-flash")

async def generate_gemini_stream (conversation_id: str, prompt_content: str):

    db = sessionLocal()
    try:
        db_messages = db.query(Message).filter(Message.Conversation_id == conversation_id).order_by(Message.created_at.asc()).all()

        # Format history for Gemini API
        gemini_history = []
        for msg in db_messages:
            role = "user" if msg.role == "user" else "model"
            gemini_history.append({
            "role": role,
            "parts": [{"text": msg.content}]
            })
        model = get_gemini_model()
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
def get_coversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Conversation).filter(
        Conversation.id == current_user.id
    ).order_by(Conversation.update_at.desc()).all()


@router.delete("/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db:Session =  Depends(get_db)
):
    
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation.id,
        Conversation.user_id == current_user.id
    ).first()
    if not conversation:
        raise HHTPException(status_code=404, details="Conversation not found")

    db.delete(conversation)
    db.commit()
    return {"Message": "Conversation deleted successfully"
    }

@router.get("/conversations/{conversation_id}/,message", response_model=List[MessageResponse])
def get_message(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session =  Depends(get_db)
):
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation.id,
        conversation.user_id == current_user.id
    ).first()

    if not conversation:
        raise HHTPException(status_code=404, details="Conversation not found")

    return db.query(Message).filter(
        Message.Conversation_id == conversation.id
    ).order_by(Message.created_at.asc()).all()


@router.post("/conversations/{conversation_id}/message/stream")
def send_message_stream(
    conversation_id: str,
    msg_in: MessageCreate,
    curretn_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conversation = db.query(Conversation).filter(
        conversation.id == conversation.id,
        Conversation.user_id == curretn_user.id
    ).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Save message to database
    conversation.updated_at = datetime.datetime.utcnow()
    db.add(conversation)
    db.commit()

    return StreamingResponse(
        generate_gemini_stream(conversation_id, msg_in.content), media_type="text/ event-stream"
    )

@router.post("/converations/{converation_id}/regenerate")
def regenerate_response(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
    ):

    conversation = db.query(Conversation).filter(
        Conversation.id == conversation.id,
        Conversation.user_id == current_user.id
    ).first()_
    if not conversation:
        raise HTTPException(status_code=404, detail="Converation not found")

    message = db.query(Message).filter(
        Message.Conversation_id == conversation.id
    ).order_by(Message.created_at.desc()).all()

    if not message:
        raise HTTPException(status_code=404, detail="No messages found in this conversation")
    
    last_msg = message[0]
    if last_msg.role == "model":
        db.delete(last_msg)
        db.commit()
        last_user_msg = message[1] if len(message) > 1 else None
    else:
        last_user_msg = last_msg
    
    if not last_user_msg or last_user_msg.role != "user":
        raise HTTPException(status_code=404, detail="Last source message must be from user to regerate")

    return StreamingResponse(
        generate_gemini_stream(conversation_id, last_user_msg.content),media_type="text/ event-stream")