from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import google.generativeai as genai
import os
import json

from app.database import get_db
from app.models import User, Decision
from app.schemas import DecisionCreate, DecisionResponse
from app.auth import get_current_user

router = APIRouter(prefix="/decisions", tags=["decisions"])

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

@router.post("/analyze", response_model=DecisionResponse, status_code=status.HTTP_201_CREATED)
def analyze_decision(
    decision_in: DecisionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    prompt = f"""
    Analyze the following decision: "{decision_in.query}"
    
    Provide the response strictly as a JSON object with the following keys:
    - "pros": A list of strings detailing the pros.
    - "cons": A list of strings detailing the cons.
    - "risks": A list of strings detailing potential risks.
    - "benefits": A list of strings detailing potential benefits.
    - "recommendation": A string providing a final recommendation.
    - "confidence_score": A float between 0 and 100 representing your confidence in this recommendation.
    - "comparison_table": A list of objects, where each object represents a row comparing alternatives (e.g. {{"feature": "Cost", "optionA": "Low", "optionB": "High"}}). Make sure to define alternatives if none are explicitly provided.
    
    Ensure the output is valid JSON without markdown wrapping.
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
        
        new_decision = Decision(
            user_id=current_user.id,
            query=decision_in.query,
            pros=json.dumps(analysis.get("pros", [])),
            cons=json.dumps(analysis.get("cons", [])),
            risks=json.dumps(analysis.get("risks", [])),
            benefits=json.dumps(analysis.get("benefits", [])),
            recommendation=analysis.get("recommendation", ""),
            confidence_score=analysis.get("confidence_score", 0.0),
            comparison_table=json.dumps(analysis.get("comparison_table", []))
        )
        
        db.add(new_decision)
        db.commit()
        db.refresh(new_decision)
        
        return new_decision
        
    except json.JSONDecodeError:
         raise HTTPException(status_code=500, detail="Failed to parse AI response into structured format.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Analysis failed: {str(e)}")

@router.get("", response_model=List[DecisionResponse])
def get_decisions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Decision).filter(Decision.user_id == current_user.id).order_by(Decision.created_at.desc()).all()

@router.get("/{decision_id}", response_model=DecisionResponse)
def get_decision(
    decision_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    decision = db.query(Decision).filter(Decision.id == decision_id, Decision.user_id == current_user.id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    return decision

@router.delete("/{decision_id}")
def delete_decision(
    decision_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    decision = db.query(Decision).filter(Decision.id == decision_id, Decision.user_id == current_user.id).first()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    
    db.delete(decision)
    db.commit()
    return {"message": "Decision deleted successfully"}
