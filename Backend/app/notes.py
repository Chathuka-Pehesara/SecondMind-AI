import os
import json
import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import google.generativeai as genai

from app.database import get_db
from app.models import Note, User
from app.schemas import NoteCreate, NoteUpdate, NoteResponse
from app.auth import get_current_user

# ChromaDB integration for semantic search over notes
import chromadb

router = APIRouter(prefix="/notes", tags=["notes"])

# Setup ChromaDB for notes
CHROMA_DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "chroma_db")
os.makedirs(CHROMA_DB_DIR, exist_ok=True)
chroma_client = chromadb.PersistentClient(path=CHROMA_DB_DIR)
notes_collection = chroma_client.get_or_create_collection(
    name="secondmind_notes",
    metadata={"hnsw:space": "cosine"}
)

def get_query_embedding(text: str) -> List[float]:
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY environment variable is not configured")
    genai.configure(api_key=GEMINI_API_KEY)
    response = genai.embed_content(
        model="models/gemini-embedding-2",
        content=text,
        task_type="retrieval_document"
    )
    return response["embedding"]

def update_note_embedding(note: Note):
    # Upsert note embedding to ChromaDB
    try:
        if not note.content.strip():
            return
        embedding = get_query_embedding(note.title + "\n\n" + note.content)
        notes_collection.upsert(
            ids=[str(note.id)],
            embeddings=[embedding],
            documents=[note.content],
            metadatas=[{"title": note.title, "user_id": note.user_id}]
        )
    except Exception as e:
        print(f"Error updating note embedding: {e}")

def delete_note_embedding(note_id: int):
    try:
        notes_collection.delete(ids=[str(note_id)])
    except Exception as e:
        print(f"Error deleting note embedding: {e}")

@router.get("", response_model=List[NoteResponse])
def get_notes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Note).filter(Note.user_id == current_user.id).order_by(Note.updated_at.desc()).all()

@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def create_note(note_data: NoteCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_note = Note(
        user_id=current_user.id,
        title=note_data.title,
        content=note_data.content,
        folder=note_data.folder,
        tags="[]"
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    
    update_note_embedding(new_note)
    
    return new_note

@router.get("/{note_id}", response_model=NoteResponse)
def get_note(note_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note

@router.put("/{note_id}", response_model=NoteResponse)
def update_note(note_id: int, note_data: NoteUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    if note_data.title is not None:
        note.title = note_data.title
    if note_data.content is not None:
        note.content = note_data.content
    if note_data.folder is not None:
        note.folder = note_data.folder
        
    note.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(note)
    
    update_note_embedding(note)
    
    return note

@router.delete("/{note_id}")
def delete_note(note_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
        
    db.delete(note)
    db.commit()
    
    delete_note_embedding(note_id)
    
    return {"message": "Note deleted successfully"}

# AI Endpoints

def get_genai_model():
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY environment variable is not configured")
    genai.configure(api_key=GEMINI_API_KEY)
    return genai.GenerativeModel('models/gemini-2.5-flash')

@router.post("/{note_id}/auto-summary", response_model=NoteResponse)
def auto_summary(note_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
        
    if not note.content.strip():
        raise HTTPException(status_code=400, detail="Note is empty")

    model = get_genai_model()
    prompt = f"Please provide a concise summary (1-3 sentences) of the following note titled '{note.title}':\n\n{note.content}"
    
    try:
        response = model.generate_content(prompt)
        note.summary = response.text.strip()
        db.commit()
        db.refresh(note)
        return note
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate summary: {e}")

@router.post("/{note_id}/auto-tags", response_model=NoteResponse)
def auto_tags(note_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
        
    if not note.content.strip():
        raise HTTPException(status_code=400, detail="Note is empty")

    model = get_genai_model()
    prompt = f"Please generate 3 to 5 relevant tags for the following note titled '{note.title}'. Output ONLY a valid JSON array of strings (e.g. [\"tag1\", \"tag2\"]). Do not include markdown formatting like ```json.\n\nContent:\n{note.content}"
    
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        # Verify it's a valid JSON array
        tags_list = json.loads(text)
        if not isinstance(tags_list, list):
            raise ValueError("Output is not a list")
            
        note.tags = json.dumps(tags_list)
        db.commit()
        db.refresh(note)
        return note
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate tags: {e}")

@router.get("/{note_id}/related")
def get_related_notes(note_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    note = db.query(Note).filter(Note.id == note_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
        
    if not note.content.strip():
        return []

    try:
        embedding = get_query_embedding(note.title + "\n\n" + note.content)
        results = notes_collection.query(
            query_embeddings=[embedding],
            n_results=5,
            where={"user_id": current_user.id}
        )
        
        related_notes = []
        if results and results.get('ids') and results['ids'][0]:
            for i, matched_id in enumerate(results['ids'][0]):
                if str(matched_id) != str(note.id):
                    # Fetch from DB to get full details
                    matched_note = db.query(Note).filter(Note.id == int(matched_id)).first()
                    if matched_note:
                        distance = results['distances'][0][i] if 'distances' in results and results['distances'] else 0
                        similarity = max(0.0, 1.0 - distance)
                        if similarity > 0.5: # only return relatively similar notes
                            related_notes.append({
                                "id": matched_note.id,
                                "title": matched_note.title,
                                "summary": matched_note.summary,
                                "similarity": similarity
                            })
        return related_notes
    except Exception as e:
        print(f"Error finding related notes: {e}")
        return []

@router.get("/suggestions/topics")
def suggest_topics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notes = db.query(Note).filter(Note.user_id == current_user.id).order_by(Note.updated_at.desc()).limit(10).all()
    if not notes:
        return ["Start your first note today!", "Daily Journal", "Meeting Notes", "Project Ideas"]
        
    notes_context = "\n".join([f"- {n.title}: {n.summary or n.content[:100]}" for n in notes])
    
    model = get_genai_model()
    prompt = f"Based on the following recent notes from the user, suggest 4 new topics they might want to write about. Output ONLY a valid JSON array of strings (e.g. [\"Topic 1\", \"Topic 2\"]). Do not include markdown formatting.\n\nRecent Notes:\n{notes_context}"
    
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        suggestions = json.loads(text)
        if not isinstance(suggestions, list):
            raise ValueError("Output is not a list")
            
        return suggestions[:4]
    except Exception as e:
        print(f"Error generating suggestions: {e}")
        return ["New Topic Ideas", "Reflections", "Action Items"]
