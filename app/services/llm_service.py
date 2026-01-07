import json
import google.generativeai as genai
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.repository import save_message, save_citation
from app.services.search_service import execute_multi_search
from app.utils.prompt_templates import STANDARD_SYSTEM_PROMPT, WEB_SEARCH_SYSTEM_PROMPT, QUERY_GEN_PROMPT

genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel(settings.MODEL_NAME)


def generate_search_queries_with_llm(user_text, chat_history):
    history_text = "\n".join([f"{msg['role']}: {msg['content']}" for msg in chat_history[-5:]])
    prompt = QUERY_GEN_PROMPT.format(history=history_text, question=user_text)
    
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        if text.startswith("```json"):
            text = text.replace("```json", "").replace("```", "")
        elif text.startswith("```"):
            text = text.replace("```", "")
            
        queries = json.loads(text)
        
        if not isinstance(queries, list):
            queries = [user_text]
            
        print(f"\n--- GENERATED WEB QUERIES ---\n{queries}\n-----------------------------")
        return queries
        
    except Exception as e:
        print(f"Query Gen Error: {e}")
        return [user_text]

def process_standard_response(db: Session, chat_id: int, user_text: str, chat_history: list):
    history_text = "\n".join([f"{msg['role']}: {msg['content']}" for msg in chat_history])
    prompt = STANDARD_SYSTEM_PROMPT.format(history=history_text, question=user_text)
    
    response = model.generate_content(prompt)
    answer_text = response.text
    
    msg_obj = save_message(db, chat_id, "assistant", answer_text, "standard")
    
    return {
        "id": msg_obj.id,
        "content": msg_obj.content,
        "role": msg_obj.role,
        "mode": msg_obj.mode,
        "citations": []
    }

def process_web_search_response(db: Session, chat_id: int, user_text: str, chat_history: list):
    queries = generate_search_queries_with_llm(user_text, chat_history)
    
    search_results = execute_multi_search(queries)
    
    formatted_sources = ""
    for res in search_results:
        formatted_sources += f"Source [{res['ref_index']}]:\nTitle: {res['title']}\nURL: {res['url']}\nContent: {res['content'][:500]}\n\n"
    
    history_text = "\n".join([f"{msg['role']}: {msg['content']}" for msg in chat_history])
    prompt = WEB_SEARCH_SYSTEM_PROMPT.format(
        search_results=formatted_sources,
        history=history_text,
        question=user_text
    )
    
    response = model.generate_content(prompt)
    answer_text = response.text
    
    msg_obj = save_message(db, chat_id, "assistant", answer_text, "web_search")
    
    final_citations = []
    for res in search_results:
        save_citation(db, msg_obj.id, res)
        final_citations.append({
            "ref_index": res['ref_index'],
            "url": res['url'],
            "title": res['title'],
            "snippet": res['content'][:200],
            "site_icon": res.get('site_icon', None) or res.get('icon', None)
        })
        
    return {
        "id": msg_obj.id,
        "content": msg_obj.content,
        "role": msg_obj.role,
        "mode": msg_obj.mode,
        "citations": final_citations
    }


def process_standard_response2(db: Session,chat_id, user_text, chat_history):

    history_text = "\n".join([f"{msg['role']}: {msg['content']}" for msg in chat_history])
    prompt = STANDARD_SYSTEM_PROMPT.format(history=history_text, question=user_text)
    answer_text = "پایتون یک زبان برنامه‌نویسی تفسیر شده، سطح بالا و همه‌منظوره است که توسط گیدو ون راسوم طراحی شد. این زبان بر خوانایی کد تأکید زیادی دارد."
    msg_obj = save_message(db, chat_id, "assistant", answer_text, "standard")


    return {
        "id": msg_obj.id,
        "content": msg_obj.content,
        "role": msg_obj.role,
        "mode": msg_obj.mode,
        "citations": []
    }






def process_web_search_response2(db: Session,chat_id, user_text, chat_history):
    search_results = gather_search_results(user_text, chat_history)

    print(user_text)
    print(chat_history)
    print(search_results)
    
    formatted_sources = ""
    for res in search_results:
        formatted_sources += f"Source [{res['ref_index']}]:\nTitle: {res['title']}\nURL: {res['url']}\nContent: {res['content'][:300]}\n\n"
    
    history_text = "\n".join([f"{msg['role']}: {msg['content']}" for msg in chat_history])
    prompt = WEB_SEARCH_SYSTEM_PROMPT.format(
        search_results=formatted_sources,
        history=history_text,
        question=user_text
    )
    
    answer_text = "طبق آخرین بررسی‌ها، گوشی پیکسل ۸ پرو دارای دوربین بسیار قدرتمندی است که از هوش مصنوعی استفاده می‌کند [1]. همچنین این گوشی تا ۷ سال آپدیت نرم‌افزاری دریافت خواهد کرد [2]."
    
    msg_obj = save_message(db, chat_id, "assistant", answer_text, "web_search")

    

    final_citations = []
    for res in search_results:
        save_citation(db, msg_obj.id, res)
        final_citations.append({
            "ref_index": res['ref_index'],
            "url": res['url'],
            "title": res['title'],
            "snippet": res['content'][:200],
            "site_icon": res.get('icon', '')
        })

    print(final_citations)
    
    return {
        "id": msg_obj.id,  
        "role": msg_obj.role,
        "content": msg_obj.content,
        "mode": msg_obj.mode,
        "citations": [
            {
                "ref_index": 1,
                "url": "https://store.google.com/product/pixel_8_pro",
                "title": "Google Pixel 8 Pro - Google Store",
                "snippet": "Meet Pixel 8 Pro, the all-pro phone engineered by Google. It has a polished aluminum frame and matte back glass.",
                "site_icon": "https://store.google.com/favicon.ico"
            },
            {
                "ref_index": 2,
                "url": "https://www.theverge.com/google-pixel-8-review",
                "title": "Google Pixel 8 and 8 Pro review: in the weeds",
                "snippet": "Google’s new phones focus heavily on AI features for photos and videos, and promise an industry-leading 7 years of support.",
                "site_icon": "https://cdn.vox-cdn.com/uploads/chorus_asset/file/7395367/favicon-32x32.0.png"
            }
        ]
    }
