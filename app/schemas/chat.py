from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ChatRequest(BaseModel):
    chat_id: Optional[int] = None
    text: str
    is_web_search: bool

class CitationSchema(BaseModel):
    ref_index: int
    url: str
    title: str
    snippet: str
    site_icon: Optional[str] = None

class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    mode: str
    citations: List[CitationSchema] = []

class ChatResponse(BaseModel):
    success: bool
    data: Optional[MessageResponse] = None
    chat_id: Optional[int] = None
    chat_title: Optional[str] = None
    error: Optional[str] = None

class ChatSummary(BaseModel):
    id: int
    title: str
    updated_at: datetime

class ChatHistoryResponse(BaseModel):
    chat_id: int
    title: str
    messages: List[MessageResponse]
