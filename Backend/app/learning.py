from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
import google.generativeai as genai
import os
import json

from app.database import get_db
from app.models import User, LearningMaterial, Flashcard, QuizQuestion
from app.schemas import LearningMaterialResponse, FlashcardResponse, FlashcardUpdate, QuizQuestionResponse
from app.auth import get_current_user

router = APIRouter(prefix="/learning", tags=["learning"])

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key = GEMINI_API_KEY)

def get_gemini_model():
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail = "Gemini API key is not configured on the server"
        )
    return genai.GenerativeModel("gemini-2.5-flash")

@router.post("/upload", response_model=LearningMaterialResponse, status_code=status.HTTP_201_CREATED)
async def upload_material(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Read file content
    try:
        content_bytes = await file.read()
        content_text = content_bytes.decode('utf-8')
    except Exception as e:
        # Fallback if it's not standard utf-8 or is a PDF (placeholder for now)
        content_text = f"Content extracted from {file.filename}: (Parsing failed, assuming text). Error: {str(e)}"
    
    # Generate study materials with Gemini
    prompt = f"""
    You are an expert AI Learning Assistant. Read the following text and generate study materials.
    
    Text:
    "{content_text[:10000]}" # Limit to avoid token overflow
    
    Respond STRICTLY with a valid JSON object containing:
    1. "summary": A concise string summarizing the core concepts.
    2. "roadmap": A list of strings representing a step-by-step learning roadmap.
    3. "flashcards": A list of objects with "front" (question/concept) and "back" (answer/definition). Provide at least 5.
    4. "quiz": A list of multiple-choice questions. Each object must have "question", "options" (a list of 4 string choices), and "correct_answer" (must exactly match one of the options). Provide at least 5.
    
    Do NOT include markdown formatting like ```json in the output.
    """
    
    try:
        model = get_gemini_model()
        response = model.generate_content(prompt)
        text_content = response.text
        if text_content.startswith("```json"):
            text_content = text_content[7:]
        if text_content.endswith("```"):
            text_content = text_content[:-3]
            
        analysis = json.loads(text_content.strip())
        
        # 1. Create Learning Material
        new_material = LearningMaterial(
            user_id=current_user.id,
            filename=file.filename,
            content_text=content_text[:2000], # store a snippet
            summary=analysis.get("summary", "Summary not generated."),
            roadmap=json.dumps(analysis.get("roadmap", []))
        )
        db.add(new_material)
        db.commit()
        db.refresh(new_material)
        
        # 2. Create Flashcards
        flashcards_data = analysis.get("flashcards", [])
        for fc in flashcards_data:
            new_fc = Flashcard(
                material_id=new_material.id,
                front=fc.get("front", ""),
                back=fc.get("back", "")
            )
            db.add(new_fc)
            
        # 3. Create Quiz Questions
        quiz_data = analysis.get("quiz", [])
        for q in quiz_data:
            new_q = QuizQuestion(
                material_id=new_material.id,
                question=q.get("question", ""),
                options_json=json.dumps(q.get("options", [])),
                correct_answer=q.get("correct_answer", "")
            )
            db.add(new_q)
            
        db.commit()
        
        # Eager load relationships for response by fetching again
        material = db.query(LearningMaterial).filter(LearningMaterial.id == new_material.id).first()
        
        # Format quiz options for schema
        for q in material.quiz_questions:
            q.options = json.loads(q.options_json) if q.options_json else []
            
        return material
        
    except json.JSONDecodeError as e:
         raise HTTPException(status_code=500, detail=f"Failed to parse AI response into structured format: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Generation failed: {str(e)}")

@router.get("/materials", response_model=List[LearningMaterialResponse])
def get_materials(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    materials = db.query(LearningMaterial).filter(LearningMaterial.user_id == current_user.id).order_by(LearningMaterial.created_at.desc()).all()
    # Format quiz options
    for mat in materials:
        for q in mat.quiz_questions:
            q.options = json.loads(q.options_json) if q.options_json else []
    return materials

@router.get("/materials/{material_id}", response_model=LearningMaterialResponse)
def get_material(
    material_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    material = db.query(LearningMaterial).filter(LearningMaterial.id == material_id, LearningMaterial.user_id == current_user.id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
        
    for q in material.quiz_questions:
        q.options = json.loads(q.options_json) if q.options_json else []
            
    return material

@router.delete("/materials/{material_id}")
def delete_material(
    material_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    material = db.query(LearningMaterial).filter(LearningMaterial.id == material_id, LearningMaterial.user_id == current_user.id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    
    db.delete(material)
    db.commit()
    return {"message": "Material deleted successfully"}

@router.put("/flashcards/{flashcard_id}")
def update_flashcard(
    flashcard_id: int,
    update_data: FlashcardUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Ensure flashcard belongs to user
    flashcard = db.query(Flashcard).join(LearningMaterial).filter(Flashcard.id == flashcard_id, LearningMaterial.user_id == current_user.id).first()
    if not flashcard:
        raise HTTPException(status_code=404, detail="Flashcard not found")
        
    flashcard.is_mastered = update_data.is_mastered
    db.commit()
    return {"message": "Flashcard updated"}

@router.put("/materials/{material_id}/progress")
def update_progress(
    material_id: int,
    score: float,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    material = db.query(LearningMaterial).filter(LearningMaterial.id == material_id, LearningMaterial.user_id == current_user.id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
        
    material.progress_score = score
    db.commit()
    return {"message": "Progress updated", "new_score": material.progress_score}
