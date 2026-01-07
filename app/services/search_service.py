from tavily import TavilyClient
from app.core.config import settings

try:
    tavily = TavilyClient(api_key=settings.TAVILY_API_KEY)
except:
    tavily = None

def perform_web_search(query: str, k: int = 3):
    if not tavily:
        return []
    try:
        response = tavily.search(query=query, max_results=k)
        return response.get('results', [])
    except Exception as e:
        print(f"Search Error: {e}")
        return []

def execute_multi_search(queries):
    aggregated_results = []
    current_index = 1
    seen_urls = set()
    
    for q in queries:
        if not q or not isinstance(q, str) or not q.strip(): 
            continue
            
        results = perform_web_search(q, k=3)
        for res in results:
            if res['url'] not in seen_urls:
                res['ref_index'] = current_index
                aggregated_results.append(res)
                seen_urls.add(res['url'])
                current_index += 1
                
    return aggregated_results