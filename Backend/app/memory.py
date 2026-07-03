import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models import User, UserPreference, Goal, Project, Fact
from app.schemas import (
    UserPreferenceCreate, UserPreferenceResponse,
    GoalCreate, GoalUpdate, GoalResponse,
    ProjectCreate, ProjectUpdate, ProjectResponse,
    FactCreate, FactResponse,
    MemorySummaryResponse
)

router = APIRouter(prefix="/memory", tags=["memory"])

# Utility to construct system context for prompt injection
def get_user_memory_context(db: Session, user_id: int) -> str:
    prefs = db.query(UserPreference).filter(UserPreference.user_id == user_id).all()
    goals = db.query(Goal).filter(Goal.user_id == user_id, Goal.status == 'active').all()
    projs = db.query(Project).filter(Project.user_id == user_id, Project.status == 'active').all()
    facts = db.query(Fact).filter(Fact.user_id == user_id).all()

    if not prefs and not goals and not projs and not facts:
        return ""

    context = "You are an AI assistant named SecondMind. Here is context about the user you are interacting with. Align your answers with their active preferences, goals, and projects.\n\n"
    
    if prefs:
        context += "[User Preferences]\n"
        for p in prefs:
            context += f"- {p.key}: {p.value}\n"
        context += "\n"
        
    if goals:
        context += "[Active Goals]\n"
        for g in goals:
            desc = f" - {g.description}" if g.description else ""
            target = f" (Target completion: {g.target_date.strftime('%Y-%m-%d')})" if g.target_date else ""
            context += f"- {g.title}{desc}{target}\n"
        context += "\n"
        
    if projs:
        context += "[Active Projects]\n"
        for pr in projs:
            desc = f" - {pr.description}" if pr.description else ""
            context += f"- {pr.name}{desc}\n"
        context += "\n"
        
    if facts:
        context += "[Important Facts]\n"
        for f in facts:
            context += f"- {f.content}\n"
        context += "\n"
        
    context += "Remember these facts and preferences when responding. Do not explicitly tell the user that you are reading this from a database unless they explicitly ask you what you remember."
    return context


# Unified Retrieval API
@router.get("/retrieve", response_model=MemorySummaryResponse)
def retrieve_memories(
    q: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    prefs_query = db.query(UserPreference).filter(UserPreference.user_id == current_user.id)
    goals_query = db.query(Goal).filter(Goal.user_id == current_user.id)
    projs_query = db.query(Project).filter(Project.user_id == current_user.id)
    facts_query = db.query(Fact).filter(Fact.user_id == current_user.id)

    if q:
        search_filter = f"%{q}%"
        prefs_query = prefs_query.filter(UserPreference.key.like(search_filter) | UserPreference.value.like(search_filter))
        goals_query = goals_query.filter(Goal.title.like(search_filter) | Goal.description.like(search_filter))
        projs_query = projs_query.filter(Project.name.like(search_filter) | Project.description.like(search_filter))
        facts_query = facts_query.filter(Fact.content.like(search_filter))

    return {
        "preferences": prefs_query.all(),
        "goals": goals_query.all(),
        "projects": projs_query.all(),
        "facts": facts_query.all()
    }


# --- User Preferences CRUD ---

@router.get("/preferences", response_model=List[UserPreferenceResponse])
def get_preferences(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(UserPreference).filter(UserPreference.user_id == current_user.id).all()

@router.post("/preferences", response_model=UserPreferenceResponse)
def create_or_update_preference(
    pref_in: UserPreferenceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing = db.query(UserPreference).filter(
        UserPreference.user_id == current_user.id,
        UserPreference.key == pref_in.key
    ).first()
    if existing:
        existing.value = pref_in.value
        existing.updated_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing
    
    new_pref = UserPreference(
        user_id=current_user.id,
        key=pref_in.key,
        value=pref_in.value
    )
    db.add(new_pref)
    db.commit()
    db.refresh(new_pref)
    return new_pref

@router.delete("/preferences/{pref_id}")
def delete_preference(pref_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pref = db.query(UserPreference).filter(
        UserPreference.id == pref_id,
        UserPreference.user_id == current_user.id
    ).first()
    if not pref:
        raise HTTPException(status_code=404, detail="Preference not found")
    db.delete(pref)
    db.commit()
    return {"message": "Preference deleted successfully"}


# --- Goals CRUD ---

@router.get("/goals", response_model=List[GoalResponse])
def get_goals(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Goal).filter(Goal.user_id == current_user.id).all()

@router.post("/goals", response_model=GoalResponse)
def create_goal(goal_in: GoalCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_goal = Goal(
        user_id=current_user.id,
        title=goal_in.title,
        description=goal_in.description,
        status=goal_in.status,
        target_date=goal_in.target_date
    )
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)
    return new_goal

@router.put("/goals/{goal_id}", response_model=GoalResponse)
def update_goal(
    goal_id: int,
    goal_up: GoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    for field, value in goal_up.dict(exclude_unset=True).items():
        setattr(goal, field, value)
    goal.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(goal)
    return goal

@router.delete("/goals/{goal_id}")
def delete_goal(goal_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()
    return {"message": "Goal deleted successfully"}


# --- Projects CRUD ---

@router.get("/projects", response_model=List[ProjectResponse])
def get_projects(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Project).filter(Project.user_id == current_user.id).all()

@router.post("/projects", response_model=ProjectResponse)
def create_project(proj_in: ProjectCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_proj = Project(
        user_id=current_user.id,
        name=proj_in.name,
        description=proj_in.description,
        status=proj_in.status
    )
    db.add(new_proj)
    db.commit()
    db.refresh(new_proj)
    return new_proj

@router.put("/projects/{proj_id}", response_model=ProjectResponse)
def update_project(
    proj_id: int,
    proj_up: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    proj = db.query(Project).filter(Project.id == proj_id, Project.user_id == current_user.id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    
    for field, value in proj_up.dict(exclude_unset=True).items():
        setattr(proj, field, value)
    proj.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(proj)
    return proj

@router.delete("/projects/{proj_id}")
def delete_project(proj_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    proj = db.query(Project).filter(Project.id == proj_id, Project.user_id == current_user.id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(proj)
    db.commit()
    return {"message": "Project deleted successfully"}


# --- Facts CRUD ---

@router.get("/facts", response_model=List[FactResponse])
def get_facts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Fact).filter(Fact.user_id == current_user.id).all()

@router.post("/facts", response_model=FactResponse)
def create_fact(fact_in: FactCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_fact = Fact(
        user_id=current_user.id,
        content=fact_in.content
    )
    db.add(new_fact)
    db.commit()
    db.refresh(new_fact)
    return new_fact

@router.put("/facts/{fact_id}", response_model=FactResponse)
def update_fact(
    fact_id: int,
    fact_up: FactCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    fact = db.query(Fact).filter(Fact.id == fact_id, Fact.user_id == current_user.id).first()
    if not fact:
        raise HTTPException(status_code=404, detail="Fact not found")
    fact.content = fact_up.content
    fact.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(fact)
    return fact

@router.delete("/facts/{fact_id}")
def delete_fact(fact_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    fact = db.query(Fact).filter(Fact.id == fact_id, Fact.user_id == current_user.id).first()
    if not fact:
        raise HTTPException(status_code=404, detail="Fact not found")
    db.delete(fact)
    db.commit()
    return {"message": "Fact deleted successfully"}
