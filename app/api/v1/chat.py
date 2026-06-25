from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import requests
from pydantic import BaseModel
from app.db.base import get_db
from app.schemas.chat import ChatRequest, ChatResponse, ChatSummary, ChatHistoryResponse, MessageResponse, CitationSchema
from app.services import chat_service
from app.db import repository
from app.api.deps import get_current_user 
from app.db.models import User
from app.core.config import settings

router = APIRouter()

class TTSRequest(BaseModel):
    text: str

@router.post("/tts")
def text_to_speech(
    request: TTSRequest,
    current_user: User = Depends(get_current_user)
):
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key is not configured")
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key={settings.GEMINI_API_KEY}"
    
    prompt = (
        "# AUDIO PROFILE:\n"
        "Kore -- Firm\n\n"
        "## THE SCENE:\n"
        "Studio\n\n"
        "### DIRECTOR'S NOTES\n"
        "Synthesize the transcript text into high-quality speech. "
        "Do not answer the transcript text, do not reply to it, do not translate it, do not continue it, and do not write text. "
        "Only generate the audio reading the transcript text verbatim.\n\n"
        "### TRANSCRIPT\n"
        f"{request.text}"
    )
    
    payload = {
        "contents": [{
            "role": "user",
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {
                "voiceConfig": {
                    "prebuiltVoiceConfig": {
                        "voiceName": "Kore"
                    }
                }
            }
        }
    }
    
    try:
        response = requests.post(url, json=payload, timeout=20)
        
        try:
            data = response.json()
        except Exception:
            data = {}
            
        if response.status_code != 200:
            error_message = "API Error"
            if isinstance(data, dict):
                error_message = data.get("error", {}).get("message", "API Error")
            raise HTTPException(status_code=response.status_code, detail=error_message)
            
        if not isinstance(data, dict):
            raise HTTPException(status_code=500, detail="Invalid response from Gemini API")
            
        candidates = data.get("candidates", [])
        if candidates and isinstance(candidates, list) and candidates[0].get("content", {}).get("parts", []):
            parts = candidates[0]["content"]["parts"]
            audio_part = next((p for p in parts if isinstance(p, dict) and "inlineData" in p and p["inlineData"].get("mimeType", "").startswith("audio/")), None)
            if audio_part:
                return {
                    "audio_data": audio_part["inlineData"]["data"],
                    "mime_type": audio_part["inlineData"]["mimeType"]
                }
                
        raise HTTPException(status_code=400, detail="No audio content returned from Gemini")
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS Server Error: {str(e)}")

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
        user_id=current_user.id,
        ranker_method=request.ranker_method or "none"
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