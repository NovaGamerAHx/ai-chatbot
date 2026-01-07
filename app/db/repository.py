from sqlalchemy.orm import Session
from datetime import datetime
from app.db.models import Chat, Message, Citation, User
import hashlib

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def create_user(db: Session, user_data):
    hashed_password = hashlib.sha256(user_data.password.encode()).hexdigest()
    new_user = User(username=user_data.username, password_hash=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

def authenticate_user(db: Session, username: str, password: str):
    user = get_user_by_username(db, username)
    if not user:
        return None
    hashed_password = hashlib.sha256(password.encode()).hexdigest()
    if user.password_hash == hashed_password:
        return user
    return None

def create_new_chat(db: Session, user_id: int, title: str = "New Chat"):
    new_chat = Chat(user_id=user_id, title=title)
    db.add(new_chat)
    db.commit()
    db.refresh(new_chat)
    return new_chat

def update_chat_timestamp(db: Session, chat_id: int):
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if chat:
        chat.updated_at = datetime.utcnow()
        db.commit()

def get_user_chats(db: Session, user_id: int):
    return db.query(Chat).filter(Chat.user_id == user_id).order_by(Chat.updated_at.desc()).all()

def get_chat_details(db: Session, chat_id: int):
    return db.query(Chat).filter(Chat.id == chat_id).first()

def delete_chat(db: Session, chat_id: int):
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if chat:
        db.query(Citation).filter(Citation.message.has(chat_id=chat_id)).delete(synchronize_session=False)
        db.query(Message).filter(Message.chat_id == chat_id).delete(synchronize_session=False)
        db.delete(chat)
        db.commit()
        return True
    return False

def update_chat_title(db: Session, chat_id: int, new_title: str):
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if chat:
        chat.title = new_title
        db.commit()
        return True
    return False

def save_message(db: Session, chat_id: int, role: str, content: str, mode: str):
    new_message = Message(chat_id=chat_id, role=role, content=content, mode=mode)
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    return new_message

def get_chat_history(db: Session, chat_id: int, limit: int = 10):
    messages = db.query(Message).filter(Message.chat_id == chat_id).order_by(Message.created_at.desc()).limit(limit).all()
    return [{"role": m.role, "content": m.content} for m in reversed(messages)]

def get_full_chat_history(db: Session, chat_id: int):
    messages = db.query(Message).filter(Message.chat_id == chat_id).order_by(Message.created_at.asc()).all()
    return messages

def save_citation(db: Session, message_id: int, data: dict):
    new_citation = Citation(
        message_id=message_id,
        ref_index=data['ref_index'],
        url=data['url'],
        title=data['title'],
        snippet=data.get('snippet', ''),
        site_icon=data.get('site_icon', '')
    )
    db.add(new_citation)
    db.commit()
