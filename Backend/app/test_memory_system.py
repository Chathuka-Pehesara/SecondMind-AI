import os
import sys

# Append parent dir for importing Backend packages
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models import User, UserPreference, Goal, Project, Fact
from app.memory import get_user_memory_context

def test_memory():
    # Setup test memory db in memory
    engine = create_engine("sqlite:///:memory:")
    Session = sessionmaker(bind=engine)
    db = Session()
    Base.metadata.create_all(bind=engine)

    print("SUCCESS: Schemas created successfully in memory DB!")

    # 1. Create test user
    test_user = User(
        full_name="Alex Coder",
        email="alex@test.com",
        hashed_password="hashedpassword"
    )
    db.add(test_user)
    db.commit()
    db.refresh(test_user)
    user_id = test_user.id
    print(f"SUCCESS: User {test_user.full_name} created with ID: {user_id}")

    # 2. Add memories
    pref = UserPreference(user_id=user_id, key="communication_style", value="very concise and direct")
    goal = Goal(user_id=user_id, title="Build a cognitive workspace", description="Integrating local files and AI context.")
    project = Project(user_id=user_id, name="SecondMind AI", description="A personal local-first knowledge manager.")
    fact = Fact(user_id=user_id, content="Preferred programming languages are Python and TypeScript.")

    db.add_all([pref, goal, project, fact])
    db.commit()
    print("SUCCESS: Memory items stored successfully!")

    # 3. Verify Prompt injection context compiling
    context = get_user_memory_context(db, user_id)
    print("\n--- Compiled LLM System Prompt Context ---")
    print(context)
    print("------------------------------------------")

    assert "communication_style" in context
    assert "Master" not in context  # (unrelated text)
    assert "SecondMind AI" in context
    assert "TypeScript" in context
    print("SUCCESS: Context generated correctly and passed assertions!")

    # 4. Verify Cascade deletes
    db.delete(test_user)
    db.commit()
    
    pref_check = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
    assert pref_check is None
    print("SUCCESS: Cascading deletions on User cleanup work perfectly!")

    db.close()

if __name__ == "__main__":
    test_memory()
