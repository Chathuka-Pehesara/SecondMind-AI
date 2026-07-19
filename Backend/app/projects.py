from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import google.generativeai as genai
import os
import json

from app.database import get_db
from app.models import User, Project, Task
from app.schemas import ProjectCreate, ProjectUpdate, ProjectResponse, TaskCreate, TaskUpdate, TaskResponse
from app.auth import get_current_user
from app.search import upsert_global_embedding, delete_global_embedding

router = APIRouter(prefix="/projects", tags=["projects"])

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key = GEMINI_API_KEY)

def get_gemini_model(system_instruction: str = None):
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail = "Gemini API key is not configured on the server"
        )
    return genai.GenerativeModel("gemini-2.5-flash", system_instruction=system_instruction)


# --- Projects CRUD ---

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_project = Project(**project_data.model_dump(), user_id=current_user.id)
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    upsert_global_embedding(new_project.id, "project", current_user.id, new_project.name, new_project.description or "")
    return new_project

@router.get("", response_model=List[ProjectResponse])
def get_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Project).filter(Project.user_id == current_user.id).all()

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    update_data = project_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(project, key, value)
        
    db.commit()
    db.refresh(project)
    upsert_global_embedding(project.id, "project", current_user.id, project.name, project.description or "")
    return project

@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.delete(project)
    db.commit()
    delete_global_embedding(project_id, "project")
    return {"message": "Project deleted successfully"}

# --- Tasks CRUD ---

@router.post("/{project_id}/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    project_id: int,
    task_data: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    new_task = Task(**task_data.model_dump(), project_id=project_id)
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    upsert_global_embedding(new_task.id, "task", current_user.id, new_task.title, new_task.description or "")
    return new_task

@router.get("/{project_id}/tasks", response_model=List[TaskResponse])
def get_tasks(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    return db.query(Task).filter(Task.project_id == project_id).all()

@router.put("/{project_id}/tasks/{task_id}", response_model=TaskResponse)
def update_task(
    project_id: int,
    task_id: int,
    task_data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    task = db.query(Task).filter(Task.id == task_id, Task.project_id == project_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    update_data = task_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)
        
    db.commit()
    db.refresh(task)
    upsert_global_embedding(task.id, "task", current_user.id, task.title, task.description or "")
    return task

@router.delete("/{project_id}/tasks/{task_id}")
def delete_task(
    project_id: int,
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    task = db.query(Task).filter(Task.id == task_id, Task.project_id == project_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    db.delete(task)
    db.commit()
    delete_global_embedding(task_id, "task")
    return {"message": "Task deleted successfully"}

# --- AI Features ---

@router.post("/{project_id}/ai/suggest-tasks")
def suggest_tasks(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    prompt = f"Given a project named '{project.name}' with description '{project.description}', suggest 5 practical tasks to get started. Format the output as a valid JSON array of objects, where each object has 'title' (string), 'description' (string), 'priority' (low, medium, high), and 'milestone' (string) fields. Do not include markdown formatting or backticks around the JSON."
    
    try:
        model = get_gemini_model("You are an expert project manager. Provide task suggestions in JSON format.")
        response = model.generate_content(prompt)
        text_content = response.text
        if text_content.startswith("```json"):
            text_content = text_content[7:]
        if text_content.endswith("```"):
            text_content = text_content[:-3]
        return json.loads(text_content.strip())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate task suggestions: {str(e)}")

@router.post("/{project_id}/ai/estimate-time")
def estimate_time(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    tasks = db.query(Task).filter(Task.project_id == project_id).all()
    if not tasks:
        return {"estimate": "No tasks to estimate."}
        
    task_descriptions = [f"{t.title}: {t.description} (Priority: {t.priority})" for t in tasks]
    tasks_text = "\n".join(task_descriptions)
    
    prompt = f"Given the project '{project.name}' and the following tasks:\n{tasks_text}\nEstimate the total completion time and breakdown. Provide a short, concise summary."
    
    try:
        model = get_gemini_model("You are an expert project manager.")
        response = model.generate_content(prompt)
        return {"estimate": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate estimate: {str(e)}")

@router.post("/{project_id}/ai/risk-analysis")
def risk_analysis(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    tasks = db.query(Task).filter(Task.project_id == project_id).all()
    task_descriptions = [f"{t.title}: {t.description}" for t in tasks]
    tasks_text = "\n".join(task_descriptions)
    
    prompt = f"Perform a brief risk analysis for the project '{project.name}' (Description: {project.description}) based on these tasks:\n{tasks_text}\nHighlight 2-3 potential risks and mitigation strategies."
    
    try:
        model = get_gemini_model("You are an expert project manager focusing on risk management.")
        response = model.generate_content(prompt)
        return {"analysis": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate risk analysis: {str(e)}")

@router.get("/{project_id}/progress")
def get_project_progress(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    tasks = db.query(Task).filter(Task.project_id == project_id).all()
    total_tasks = len(tasks)
    if total_tasks == 0:
        return {"progress": 0, "completed": 0, "total": 0}
        
    completed_tasks = sum(1 for t in tasks if t.status == "completed")
    progress = (completed_tasks / total_tasks) * 100
    
    return {
        "progress": round(progress, 2),
        "completed": completed_tasks,
        "total": total_tasks
    }
