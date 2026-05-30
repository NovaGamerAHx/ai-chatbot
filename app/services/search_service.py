from tavily import TavilyClient
from app.core.config import settings
from app.services.ranker_service import rerank_results

try:
    tavily = TavilyClient(api_key=settings.TAVILY_API_KEY)
except:
    tavily = None

def perform_web_search(query: str, k: int = 10):
    if not tavily:
        return []
    try:
        response = tavily.search(query=query, max_results=k)
        return response.get('results', [])
    except:
        return []


def execute_multi_search(queries):
    aggregated_results = []
    seen_urls = set()
    current_index = 1
    
    for q in queries:
        if not q or not isinstance(q, str) or not q.strip(): 
            continue
            
        print(f"\n========== QUERY: {q} ==========")
        
        raw_results = perform_web_search(q, k=10)
        
        print("--- ORIGINAL TAVILY RESULTS (TOP 10) ---")
        for i, res in enumerate(raw_results):
            print(f"{i+1}. {res.get('title', '')} | {res.get('url', '')}")
            
        ranked_results = rerank_results(query=q, results=raw_results, method="mix")
        
        top_results = ranked_results[:3]
        
        print("\n--- RERANKED RESULTS FOR LLM (TOP 3) ---")
        for i, res in enumerate(top_results):
            print(f"{i+1}. {res.get('title', '')} | {res.get('url', '')}")
        print("========================================\n")
        
        for res in top_results:
            if res['url'] not in seen_urls:
                res['ref_index'] = current_index
                aggregated_results.append(res)
                seen_urls.add(res['url'])
                current_index += 1
                
    return aggregated_results