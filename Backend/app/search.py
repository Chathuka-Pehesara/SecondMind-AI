import os
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import google.generativeai as genai
import chromadb

from app.database import get_db
from app.models import User
from app.auth import get_current_user

router = APIRouter(prefix="/search", tags=["search"])

# Setup ChromaDB for global search
CHROMA_DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "chroma_db")
os.makedirs(CHROMA_DB_DIR, exist_ok=True)
chroma_client = chromadb.PersistentClient(path=CHROMA_DB_DIR)

global_collection = chroma_client.get_or_create_collection(
    name="secondmind_global",
    metadata={"hnsw:space": "cosine"}
)
notes_collection = chroma_client.get_or_create_collection(
    name="secondmind_notes",
    metadata={"hnsw:space": "cosine"}
)
rag_collection = chroma_client.get_or_create_collection(
    name="secondmind_rag",
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
        task_type="retrieval_query"
    )
    return response["embedding"]

def upsert_global_embedding(item_id: str, item_type: str, user_id: int, title: str, content: str):
    try:
        if not title.strip() and not content.strip():
            return
        
        full_text = f"{title}\n\n{content}".strip()
        embedding = get_query_embedding(full_text)
        global_collection.upsert(
            ids=[f"{item_type}_{item_id}"],
            embeddings=[embedding],
            documents=[full_text],
            metadatas=[{"type": item_type, "item_id": str(item_id), "user_id": user_id, "title": title}]
        )
    except Exception as e:
        print(f"Error updating global embedding for {item_type} {item_id}: {e}")

def delete_global_embedding(item_id: str, item_type: str):
    try:
        global_collection.delete(ids=[f"{item_type}_{item_id}"])
    except Exception as e:
        print(f"Error deleting global embedding for {item_type} {item_id}: {e}")

@router.get("")
def search_all(q: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not q or not q.strip():
        return []
    
    try:
        query_embedding = get_query_embedding(q)
        results = []
        
        # 1. Search Global Collection (Chats, Projects, Tasks, Goals)
        global_res = global_collection.query(
            query_embeddings=[query_embedding],
            n_results=10,
            where={"user_id": current_user.id}
        )
        if global_res and global_res.get('ids') and global_res['ids'][0]:
            for i, matched_id in enumerate(global_res['ids'][0]):
                distance = global_res['distances'][0][i] if 'distances' in global_res else 0
                similarity = max(0.0, 1.0 - distance)
                meta = global_res['metadatas'][0][i]
                doc = global_res['documents'][0][i] if 'documents' in global_res else ""
                
                results.append({
                    "id": meta.get("item_id"),
                    "type": meta.get("type"),
                    "title": meta.get("title", "Untitled"),
                    "snippet": doc[:200] + "..." if len(doc) > 200 else doc,
                    "similarity": similarity
                })
                
        # 2. Search Notes Collection
        notes_res = notes_collection.query(
            query_embeddings=[query_embedding],
            n_results=10,
            where={"user_id": current_user.id}
        )
        if notes_res and notes_res.get('ids') and notes_res['ids'][0]:
            for i, matched_id in enumerate(notes_res['ids'][0]):
                distance = notes_res['distances'][0][i] if 'distances' in notes_res else 0
                similarity = max(0.0, 1.0 - distance)
                meta = notes_res['metadatas'][0][i]
                doc = notes_res['documents'][0][i] if 'documents' in notes_res else ""
                
                results.append({
                    "id": matched_id,
                    "type": "note",
                    "title": meta.get("title", "Untitled Note"),
                    "snippet": doc[:200] + "..." if len(doc) > 200 else doc,
                    "similarity": similarity
                })
                
        # 3. Search RAG Collection (Documents)
        from app.models import Conversation
        user_conversations = db.query(Conversation.id).filter(Conversation.user_id == current_user.id).all()
        conv_ids = [c[0] for c in user_conversations]
        
        if conv_ids:
            rag_res = rag_collection.query(
                query_embeddings=[query_embedding],
                n_results=10,
                where={"conversation_id": {"$in": conv_ids}}
            )
            if rag_res and rag_res.get('ids') and rag_res['ids'][0]:
                for i, matched_id in enumerate(rag_res['ids'][0]):
                    distance = rag_res['distances'][0][i] if 'distances' in rag_res else 0
                    similarity = max(0.0, 1.0 - distance)
                    meta = rag_res['metadatas'][0][i]
                    doc = rag_res['documents'][0][i] if 'documents' in rag_res else ""
                    
                    results.append({
                        "id": matched_id,
                        "type": "document",
                        "title": meta.get("filename", "Document"),
                        "snippet": doc[:200] + "..." if len(doc) > 200 else doc,
                        "similarity": similarity,
                        "conversation_id": meta.get("conversation_id")
                    })
                    
        # Sort combined results by similarity descending
        results.sort(key=lambda x: x['similarity'], reverse=True)
        
        # Deduplicate and return top 20
        unique_results = []
        seen = set()
        for r in results:
            key = f"{r['type']}_{r['id']}"
            if key not in seen:
                seen.add(key)
                unique_results.append(r)
                if len(unique_results) >= 20:
                    break
                    
        return unique_results
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
