import requests
from app.core.config import settings


DEFAULT_RANKER_METHOD = "mix"
VALID_RANKER_METHODS = {"none", "cohere", "jina", "mix"}


def get_default_indices(documents: list):
    return list(range(len(documents)))


def normalize_ranker_method(method: str | None):
    normalized_method = (method or DEFAULT_RANKER_METHOD).strip().lower()
    if normalized_method in VALID_RANKER_METHODS:
        return normalized_method
    return DEFAULT_RANKER_METHOD


def get_cohere_indices(query: str, documents: list):
    if not settings.COHERE_API_KEY:
        return get_default_indices(documents)
    url = "https://api.cohere.ai/v1/rerank"
    headers = {
        "Authorization": f"Bearer {settings.COHERE_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "rerank-multilingual-v3.0",
        "query": query,
        "documents": documents,
        "return_documents": False
    }
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        response.raise_for_status()
        return [res["index"] for res in response.json().get("results", [])]
    except Exception:
        return get_default_indices(documents)


def get_jina_indices(query: str, documents: list):
    if not settings.JINA_API_KEY:
        return get_default_indices(documents)
    url = "https://api.jina.ai/v1/rerank"
    headers = {
        "Authorization": f"Bearer {settings.JINA_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "jina-reranker-v2-base-multilingual",
        "query": query,
        "documents": documents
    }
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        response.raise_for_status()
        return [res["index"] for res in response.json().get("results", [])]
    except Exception:
        return get_default_indices(documents)


def rerank_results(query: str, results: list, method: str = DEFAULT_RANKER_METHOD):
    normalized_method = normalize_ranker_method(method)
    if not results or len(results) <= 1 or normalized_method == "none":
        return results
    documents = [doc.get("content", "") for doc in results]
    if normalized_method == "cohere":
        indices = get_cohere_indices(query, documents)
    elif normalized_method == "jina":
        indices = get_jina_indices(query, documents)
    else:
        cohere_indices = get_cohere_indices(query, documents)
        jina_indices = get_jina_indices(query, documents)
        doc_count = len(documents)
        ranks = {i: {"cohere": doc_count, "jina": doc_count} for i in range(doc_count)}
        for rank, orig_idx in enumerate(cohere_indices):
            ranks[orig_idx]["cohere"] = rank
        for rank, orig_idx in enumerate(jina_indices):
            ranks[orig_idx]["jina"] = rank
        indices = sorted(ranks.keys(), key=lambda i: (ranks[i]["cohere"] + ranks[i]["jina"]) / 2.0)
    return [results[i] for i in indices if 0 <= i < len(results)]
