import json
import google.generativeai as genai
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.logging_config import logger
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
        return queries
    except Exception:
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



def process_web_search_response(db: Session, chat_id: int, user_text: str, chat_history: list, ranker_method: str = "mix"):
    queries = generate_search_queries_with_llm(user_text, chat_history)
    search_results = execute_multi_search(queries, ranker_method=ranker_method)

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
            "ref_index": res["ref_index"],
            "url": res["url"],
            "title": res["title"],
            "snippet": res["content"][:200],
            "site_icon": res.get("site_icon") or res.get("icon")
        })

    log_block = [
        "=" * 80,
        f"USER PROMPT:\n{user_text}",
        "",
        "SEARCH QUERIES:"
    ]

    for index, query in enumerate(queries, start=1):
        log_block.append(f"{index}. {query}")

    log_block.extend([
        "",
        f"FINAL RESPONSE:\n{answer_text}",
        "=" * 80,
        ""
    ])
    logger.info("\n".join(log_block))

    return {
        "id": msg_obj.id,
        "content": msg_obj.content,
        "role": msg_obj.role,
        "mode": msg_obj.mode,
        "citations": final_citations
    }
