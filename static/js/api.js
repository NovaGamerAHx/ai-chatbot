async function request(endpoint, method = 'GET', body = null) {
    let token = localStorage.getItem(CONFIG.TOKEN_KEY);
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (token) {
        token = token.replace(/"/g, ''); 
        headers['Authorization'] = token;
    }

    const options = { method, headers };
    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, options);
        
        if (response.status === 401) {
            localStorage.removeItem(CONFIG.TOKEN_KEY);
            window.location.href = 'login.html';
            return;
        }

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || 'API Error');
        }
        return data;
    } catch (error) {
        console.error('API Request Failed:', error);
        throw error;
    }
}

const API = {
    auth: {
        login: (username, password) => request('/auth/login', 'POST', { username, password }),
        register: (username, password) => request('/auth/register', 'POST', { username, password })
    },
    chat: {
        list: () => request('/chat/list'),
        history: (chatId) => request(`/chat/${chatId}/history`),
        send: (chatId, text, isWeb) => request('/chat/send', 'POST', { chat_id: chatId, text: text, is_web_search: isWeb }),
        delete: (chatId) => request(`/chat/${chatId}`, 'DELETE'),
        rename: (chatId, title) => request(`/chat/${chatId}/rename?title=${title}`, 'PUT')
    }
};