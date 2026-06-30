import json
import google.generativeai as genai
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.logging_config import logger
from app.db.repository import save_message, save_citation
from app.services.ranker_service import DEFAULT_RANKER_METHOD, normalize_ranker_method
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


def build_search_log_block(user_text: str, queries: list, answer_text: str, ranker_method: str, search_trace: list):
    log_block = [
        "=" * 80,
        f"USER PROMPT:\n{user_text}",
        "",
        f"RANKER METHOD: {ranker_method}",
        "",
        "SEARCH QUERIES:"
    ]

    for index, query in enumerate(queries, start=1):
        log_block.append(f"{index}. {query}")

    if search_trace:
        log_block.extend(["", "SEARCH ORDERS:"])
        for index, trace in enumerate(search_trace, start=1):
            log_block.append(f"{index}. QUERY: {trace['query']}")
            initial_order = trace.get("initial_order", [])
            reranked_order = trace.get("reranked_order", [])
            selected_order = trace.get("selected_order", [])
            log_block.append("   INITIAL ORDER:")
            if initial_order:
                for site_index, url in enumerate(initial_order, start=1):
                    log_block.append(f"   {site_index}. {url}")
            else:
                log_block.append("   - No results")
            log_block.append("   RERANKED ORDER:")
            if reranked_order:
                for site_index, url in enumerate(reranked_order, start=1):
                    log_block.append(f"   {site_index}. {url}")
            else:
                log_block.append("   - No results")
            log_block.append("   SELECTED TOP RESULTS:")
            if selected_order:
                for site_index, url in enumerate(selected_order, start=1):
                    log_block.append(f"   {site_index}. {url}")
            else:
                log_block.append("   - No results")

    log_block.extend([
        "",
        f"FINAL RESPONSE:\n{answer_text}",
        "=" * 80,
        ""
    ])
    return log_block


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


def process_web_search_response(db: Session, chat_id: int, user_text: str, chat_history: list, ranker_method: str = DEFAULT_RANKER_METHOD):
    queries = generate_search_queries_with_llm(user_text, chat_history)
    normalized_ranker_method = normalize_ranker_method(ranker_method)
    search_data = execute_multi_search(queries, ranker_method=normalized_ranker_method)
    search_results = search_data["results"]

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

    logger.info("\n".join(build_search_log_block(
        user_text=user_text,
        queries=queries,
        answer_text=answer_text,
        ranker_method=search_data["ranker_method"],
        search_trace=search_data["trace"]
    )))

    return {
        "id": msg_obj.id,
        "content": msg_obj.content,
        "role": msg_obj.role,
        "mode": msg_obj.mode,
        "citations": final_citations
    }
