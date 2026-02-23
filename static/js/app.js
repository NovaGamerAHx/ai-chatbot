const app = {
    currentChatId: null,
    isWebSearch: false,
    isSending: false,

    async init() {
        if (!localStorage.getItem(CONFIG.TOKEN_KEY)) {
            window.location.href = 'login.html';
            return;
        }

        // نمایش نام کاربری در سایدبار
        this.displayUsername();

        this.bindEvents();
        
        const urlParams = new URLSearchParams(window.location.search);
        const urlChatId = urlParams.get('chat_id');
        
        await this.loadChatList();

        if (urlChatId) {
            await this.loadChat(parseInt(urlChatId));
        } else {
            UI.clearMessages();
        }
    },

    // تابع جدید برای نمایش نام
    displayUsername() {
        const username = localStorage.getItem('chat_username') || 'User';
        const userElement = document.getElementById('current-username');
        if (userElement) {
            userElement.innerText = username;
        }
    },

    bindEvents() {
        UI.elements.sendBtn.addEventListener('click', () => this.sendMessage());
        
        UI.elements.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize input listener
        UI.elements.messageInput.addEventListener('input', () => {
            UI.autoResize();
        });

        UI.elements.webToggle.addEventListener('click', () => {
            this.isWebSearch = !this.isWebSearch;
            UI.toggleWebSearch(this.isWebSearch);
        });

        UI.elements.newChatBtn.addEventListener('click', () => {
            this.currentChatId = null;
            UI.clearMessages();
            UI.elements.chatTitle.innerText = 'New Chat';
            window.history.pushState({}, '', window.location.pathname);
            document.querySelectorAll('.chat-item').forEach(el => el.classList.remove('active'));
        });
        
        document.getElementById('logout-btn').addEventListener('click', () => {
            localStorage.removeItem(CONFIG.TOKEN_KEY);
            localStorage.removeItem('chat_username'); // حذف نام کاربری هنگام خروج
            window.location.href = 'login.html';
        });
    },

    async loadChatList() {
        try {
            const chats = await API.chat.list();
            UI.renderChatList(chats, this.currentChatId);
        } catch (err) {
            console.error(err);
        }
    },

    async loadChat(chatId) {
        if (this.currentChatId === chatId) return;
        this.currentChatId = chatId;
        
        const url = new URL(window.location);
        url.searchParams.set('chat_id', chatId);
        window.history.pushState({}, '', url);

        UI.elements.messagesContainer.innerHTML = ''; 
        const loading = UI.showLoading();
        
        try {
            const data = await API.chat.history(chatId);
            UI.removeLoading(loading);
            
            UI.elements.chatTitle.innerText = data.title;
            data.messages.forEach(msg => {
                UI.appendMessage(msg.role, msg.content, msg.citations);
            });
            this.loadChatList(); 
        } catch (err) {
            UI.removeLoading(loading);
            console.error(err);
        }
    },

    async sendMessage() {
        const text = UI.elements.messageInput.value.trim();
        if (!text || this.isSending) return;

        this.isSending = true;
        UI.elements.messageInput.value = '';
        UI.autoResize(); // Reset height after sending
        UI.appendMessage('user', text);
        const loading = UI.showLoading();

        try {
            const response = await API.chat.send(this.currentChatId, text, this.isWebSearch);
            UI.removeLoading(loading);
            
            if (response.success) {
                if (response.chat_id) {
                    this.currentChatId = response.chat_id;
                    
                    const url = new URL(window.location);
                    url.searchParams.set('chat_id', this.currentChatId);
                    window.history.pushState({}, '', url);
                    
                    if (response.chat_title) {
                        UI.elements.chatTitle.innerText = response.chat_title;
                    }
                    
                    this.loadChatList();
                }
                
                const msg = response.data;
                UI.appendMessage(msg.role, msg.content, msg.citations);
            } else {
                UI.appendMessage('assistant', 'Error: ' + (response.error || 'Unknown error'));
            }
        } catch (err) {
            UI.removeLoading(loading);
            UI.appendMessage('assistant', 'Error: Could not connect to server.');
        } finally {
            this.isSending = false;
        }
    },

    async deleteChat(chatId, event) {
        event.stopPropagation();
        if (!confirm('Are you sure?')) return;
        try {
            await API.chat.delete(chatId);
            if (this.currentChatId === chatId) {
                this.currentChatId = null;
                UI.clearMessages();
                window.history.pushState({}, '', window.location.pathname);
            }
            this.loadChatList();
        } catch (err) {
            alert('Delete failed');
        }
    }
};

window.app = app;
document.addEventListener('DOMContentLoaded', () => app.init());