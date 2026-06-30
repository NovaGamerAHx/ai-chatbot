from tavily import TavilyClient
from app.core.config import settings
from app.services.ranker_service import rerank_results

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



def execute_multi_search(queries, ranker_method: str = "mix"):
    aggregated_results = []
    seen_urls = set()
    current_index = 1

    for q in queries:
        if not q or not isinstance(q, str) or not q.strip():
            continue

        query = q.strip()
        raw_results = perform_web_search(query, k=10)
        ranked_results = rerank_results(query=query, results=raw_results, method=ranker_method)
        top_results = ranked_results[:3]

        for res in top_results:
            url = res.get("url")
            if not url or url in seen_urls:
                continue
            result_copy = dict(res)
            result_copy["ref_index"] = current_index
            aggregated_results.append(result_copy)
            seen_urls.add(url)
            current_index += 1

    return aggregated_results
