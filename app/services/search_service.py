from tavily import TavilyClient
from app.core.config import settings
from app.services.ranker_service import DEFAULT_RANKER_METHOD, normalize_ranker_method, rerank_results

try:
    tavily = TavilyClient(api_key=settings.TAVILY_API_KEY)
except Exception:
    tavily = None


def perform_web_search(query: str, k: int = 10):
    if not tavily:
        return []
    try:
        response = tavily.search(query=query, max_results=k)
        return response.get("results", [])
    except Exception:
        return []


def build_search_trace(query: str, raw_results: list, ranked_results: list, selected_results: list):
    raw_urls = [result.get("url") for result in raw_results if result.get("url")]
    ranked_urls = [result.get("url") for result in ranked_results if result.get("url")]
    selected_urls = [result.get("url") for result in selected_results if result.get("url")]
    return {
        "query": query,
        "initial_order": raw_urls,
        "reranked_order": ranked_urls,
        "selected_order": selected_urls
    }


def execute_multi_search(queries, ranker_method: str = DEFAULT_RANKER_METHOD):
    normalized_ranker_method = normalize_ranker_method(ranker_method)
    aggregated_results = []
    search_trace = []
    seen_urls = set()
    current_index = 1

    for q in queries:
        if not q or not isinstance(q, str) or not q.strip():
            continue

        query = q.strip()
        raw_results = perform_web_search(query, k=10)
        ranked_results = rerank_results(query=query, results=raw_results, method=normalized_ranker_method)
        top_results = ranked_results[:3]
        search_trace.append(build_search_trace(query, raw_results, ranked_results, top_results))

        for res in top_results:
            url = res.get("url")
            if not url or url in seen_urls:
                continue
            result_copy = dict(res)
            result_copy["ref_index"] = current_index
            aggregated_results.append(result_copy)
            seen_urls.add(url)
            current_index += 1

    return {
        "results": aggregated_results,
        "ranker_method": normalized_ranker_method,
        "trace": search_trace
    }
