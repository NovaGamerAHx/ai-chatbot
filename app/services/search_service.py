from tavily import TavilyClient
from app.core.config import settings

tavily = TavilyClient(api_key=settings.TAVILY_API_KEY)

def generate_search_queries(user_text, chat_history):
    return [user_text]

def perform_web_search(query: str, k: int = 3):
    try:
        response = tavily.search(query=query, max_results=k)
        print("response")
        return response.get('results', [])
    except:
        return []

def gather_search_results(user_text, chat_history):
    queries = generate_search_queries(user_text, chat_history)
    print(queries)
    aggregated_results = []
    current_index = 1
    
    for q in queries:
        results = perform_web_search(q, k=3)
        for res in results:
            res['ref_index'] = current_index
            aggregated_results.append(res)
            current_index += 1
            
    return aggregated_results
