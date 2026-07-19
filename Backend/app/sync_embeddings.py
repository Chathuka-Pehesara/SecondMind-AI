import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import sessionLocal
from app.models import Project, Task, Goal, Fact, Conversation, Message
from app.search import upsert_global_embedding

def sync():
    db = sessionLocal()
    try:
        print("Syncing Projects...")
        projects = db.query(Project).all()
        for p in projects:
            upsert_global_embedding(p.id, "project", p.user_id, p.name, p.description or "")
            
        print("Syncing Tasks...")
        tasks = db.query(Task).all()
        for t in tasks:
            project = db.query(Project).filter(Project.id == t.project_id).first()
            if project:
                upsert_global_embedding(t.id, "task", project.user_id, t.title, t.description or "")

        print("Syncing Goals...")
        goals = db.query(Goal).all()
        for g in goals:
            upsert_global_embedding(g.id, "goal", g.user_id, g.title, g.description or "")

        print("Syncing Facts...")
        facts = db.query(Fact).all()
        for f in facts:
            upsert_global_embedding(f.id, "fact", f.user_id, "Fact", f.content)

        print("Syncing Chats...")
        conversations = db.query(Conversation).all()
        for c in conversations:
            messages = db.query(Message).filter(Message.conversation_id == c.id).all()
            if messages:
                full_text = " ".join([m.content for m in messages])
                upsert_global_embedding(c.id, "chat", c.user_id, c.title, full_text)

        print("Sync Complete!")
    except Exception as e:
        print(f"Error syncing embeddings: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    sync()
