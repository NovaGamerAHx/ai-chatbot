from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.base import get_db
from app.schemas.chat import ChatRequest, ChatResponse, ChatSummary, ChatHistoryResponse, MessageResponse, CitationSchema
from app.services import chat_service
from app.db import repository
from app.api.deps import get_current_user  # ایمپورت تابع اصلاح شده
from app.db.models import User

router = APIRouter()

@router.post("/send", response_model=ChatResponse)
def send_message(
    request: ChatRequest, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if request.chat_id:
        chat = repository.get_chat_details(db, request.chat_id)
        if not chat or chat.user_id != current_user.id:
             raise HTTPException(status_code=403, detail="Access denied")

    result = chat_service.handle_chat_request(
        db=db,
        chat_id=request.chat_id,
        user_text=request.text,
        is_web_search=request.is_web_search,
        user_id=current_user.id
    )
    return result

@router.get("/list", response_model=List[ChatSummary])
def get_chats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return repository.get_user_chats(db, user_id=current_user.id)

@router.get("/{chat_id}/history", response_model=ChatHistoryResponse)
def get_chat_history(
    chat_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chat = repository.get_chat_details(db, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    if chat.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    messages_db = repository.get_full_chat_history(db, chat_id)
    
    formatted_messages = []
    for msg in messages_db:
        formatted_citations = []
        for cit in msg.citations:
            formatted_citations.append(CitationSchema(
                ref_index=cit.ref_index,
                url=cit.url,
                title=cit.title,
                snippet=cit.snippet,
                site_icon=cit.site_icon
            ))
            
        formatted_messages.append(MessageResponse(
            id=msg.id,
            role=msg.role,
            content=msg.content,
            mode=msg.mode if msg.mode else "standard",
            citations=formatted_citations
        ))
        
    return ChatHistoryResponse(chat_id=chat.id, title=chat.title, messages=formatted_messages)

@router.delete("/{chat_id}")
def delete_chat(
    chat_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chat = repository.get_chat_details(db, chat_id)
    if not chat or chat.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Not found or access denied")
        
    repository.delete_chat(db, chat_id)
    return {"status": "deleted"}

@router.put("/{chat_id}/rename")
def rename_chat(
    chat_id: int, 
    title: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chat = repository.get_chat_details(db, chat_id)
    if not chat or chat.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Not found or access denied")

    repository.update_chat_title(db, chat_id, title)
    return {"status": "renamed", "title": title}
