from sqlalchemy.orm import Session
from app.db.repository import save_message, update_chat_timestamp, get_chat_history, create_new_chat, delete_chat
from app.services.llm_service import process_standard_response, process_web_search_response
import time

def handle_chat_request(db: Session, chat_id: int, user_text: str, is_web_search: bool, user_id: int):
    current_chat_id = chat_id
    is_new_chat = False
    chat_title = None

    try:
        if not current_chat_id:
            is_new_chat = True
            initial_title = user_text[:30] + "..." if len(user_text) > 30 else user_text
            new_chat_obj = create_new_chat(db, user_id=user_id, title=initial_title)
            current_chat_id = new_chat_obj.id
            chat_title = initial_title

        user_mode = "web_search" if is_web_search else "standard"
        save_message(db, current_chat_id, "user", user_text, user_mode)
        update_chat_timestamp(db, current_chat_id)
        
        chat_history = get_chat_history(db, current_chat_id)
        
        if is_web_search:
            response_data = process_web_search_response(db, current_chat_id, user_text, chat_history)
        else:
            response_data = process_standard_response(db, current_chat_id, user_text, chat_history)
            
        return {
            "success": True,
            "data": response_data,
            "chat_id": current_chat_id,
            "chat_title": chat_title
        }
        
    except Exception as e:
        if is_new_chat and current_chat_id:
            try:
                delete_chat(db, current_chat_id)
            except:
                pass
                
        return {
            "success": False,
            "error": str(e)
        }