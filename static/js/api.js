const MOCK_DB_KEY = 'mock_database';

function initMockDB() {
    if (!localStorage.getItem(MOCK_DB_KEY)) {
        localStorage.setItem(MOCK_DB_KEY, JSON.stringify({
            chats: [
                { id: 1, title: 'راهنمای استفاده از هوش مصنوعی' }
            ],
            messages: {
                1: [
                    { role: 'assistant', content: 'سلام! من دستیار هوشمند شما هستم. چطور می‌توانم کمک کنم؟', citations: [] }
                ]
            }
        }));
    }
}

async function request(endpoint, method = 'GET', body = null) {
    if (CONFIG.USE_MOCK && 0) {
        return handleMockRequest(endpoint, method, body);
    }

    let token = localStorage.getItem(CONFIG.TOKEN_KEY);
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        token = token.replace(/"/g, ''); 
        headers['Authorization'] = token;
    }

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, options);
        if (response.status === 401) {
            localStorage.removeItem(CONFIG.TOKEN_KEY);
            window.location.href = 'login.html';
            return;
        }
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'خطای API');
        return data;
    } catch (error) {
        console.error('API Request Failed:', error);
        throw error;
    }
}

function handleMockRequest(endpoint, method, body) {
    initMockDB();
    const db = JSON.parse(localStorage.getItem(MOCK_DB_KEY));

    return new Promise((resolve) => {
        setTimeout(() => {
            if (endpoint.includes('/auth/')) {
                resolve({ access_token: 'mock_token', username: body.username });
            } 
            else if (endpoint === '/chat/list') {
                resolve(db.chats);
            } 
            else if (endpoint.includes('/history')) {
                const chatId = parseInt(endpoint.split('/')[2]);
                const chat = db.chats.find(c => c.id === chatId);
                resolve({
                    title: chat ? chat.title : 'چت جدید',
                    messages: db.messages[chatId] || []
                });
            } 
            else if (endpoint === '/chat/send') {
                let chatId = body.chat_id;
                let isNewChat = false;

                if (!chatId) {
                    chatId = Date.now();
                    isNewChat = true;
                    db.chats.unshift({ id: chatId, title: body.text.substring(0, 30) + '...' });
                    db.messages[chatId] = [];
                }

                db.messages[chatId].push({ role: 'user', content: body.text });

                let finalContent;
                let finalCitations = [];
                
                if (body.is_web_search) {
                    const mockData = WEB_SEARCH_MOCK_DATA[Math.floor(Math.random() * WEB_SEARCH_MOCK_DATA.length)];
                    finalContent = mockData.content;
                    finalCitations = mockData.citations || [];
                } else {
                    const mockResponses = [
                        "این یک پاسخ آزمایشی از سمت سرور محلی (Mock) است.",
                        "بله، متوجه منظور شما شدم. لطفاً ادامه دهید.",
                        `در مورد "${body.text}" باید بگویم که این یک موضوع جالب است!`,
                        "من در حال حاضر به صورت آفلاین کار می‌کنم و اطلاعات من محدود است."
                    ];
                    finalContent = mockResponses[Math.floor(Math.random() * mockResponses.length)];
                }
                
                const assistantMessage = { role: 'assistant', content: finalContent, citations: finalCitations };
                db.messages[chatId].push(assistantMessage);
                
                localStorage.setItem(MOCK_DB_KEY, JSON.stringify(db));

                resolve({
                    success: true,
                    chat_id: chatId,
                    chat_title: isNewChat ? db.chats[0].title : null,
                    data: assistantMessage
                });
            }
            else if (method === 'DELETE') {
                const chatId = parseInt(endpoint.split('/')[2]);
                db.chats = db.chats.filter(c => c.id !== chatId);
                delete db.messages[chatId];
                localStorage.setItem(MOCK_DB_KEY, JSON.stringify(db));
                resolve({ success: true });
            }
            else {
                resolve({ success: true });
            }
        }, 200);
    });
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
