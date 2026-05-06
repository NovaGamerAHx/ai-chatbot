const app = {
    currentChatId: null,
    isWebSearch: false,
    isSending: false,
    chats: [],

    async init() {
        if (CONFIG.USE_MOCK && 0) {
            localStorage.setItem(CONFIG.TOKEN_KEY, 'mock_token');
            if(!localStorage.getItem('chat_username')) localStorage.setItem('chat_username', 'توسعه دهنده');
        }

        if (!localStorage.getItem(CONFIG.TOKEN_KEY)) {
            window.location.href = 'login.html';
            return;
        }

        this.initTheme();
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

    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        if (savedTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        
        const themeBtn = document.getElementById('theme-toggle');
        if(themeBtn) {
            themeBtn.innerHTML = savedTheme === 'dark' ? '<i data-lucide="sun" class="w-5 h-5"></i>' : '<i data-lucide="moon" class="w-5 h-5"></i>';
            lucide.createIcons();
            themeBtn.addEventListener('click', () => {
                document.documentElement.classList.toggle('dark');
                const isDark = document.documentElement.classList.contains('dark');
                localStorage.setItem('theme', isDark ? 'dark' : 'light');
                themeBtn.innerHTML = isDark ? '<i data-lucide="sun" class="w-5 h-5"></i>' : '<i data-lucide="moon" class="w-5 h-5"></i>';
                lucide.createIcons();
            });
        }
    },

    displayUsername() {
        const username = localStorage.getItem('chat_username') || 'کاربر';
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

        UI.elements.messageInput.addEventListener('input', () => {
            UI.autoResize();
        });

        UI.elements.webToggle.addEventListener('click', () => {
            this.isWebSearch = !this.isWebSearch;
            UI.toggleWebSearch(this.isWebSearch);
        });

        const micBtn = document.getElementById('mic-btn');
        if(micBtn) {
            micBtn.addEventListener('click', () => {
                alert('قابلیت دریافت صدا به زودی اضافه می‌شود.');
            });
        }

        UI.elements.newChatBtn.addEventListener('click', () => {
            this.currentChatId = null;
            UI.clearMessages();
            UI.elements.chatTitle.innerText = 'چت جدید';
            window.history.pushState({}, '', window.location.pathname);
            UI.renderChatList(this.chats, this.currentChatId);
        });
        
        document.getElementById('logout-btn').addEventListener('click', () => {
            localStorage.removeItem(CONFIG.TOKEN_KEY);
            localStorage.removeItem('chat_username');
            window.location.href = 'login.html';
        });

        const sidebarToggle = document.getElementById('sidebar-toggle');
        const sidebar = document.getElementById('sidebar');
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('closed');
            });
        }

        const searchInput = document.getElementById('search-chat-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                const filtered = this.chats.filter(c => c.title.toLowerCase().includes(term));
                UI.renderChatList(filtered, this.currentChatId);
            });
        }
    },

    async loadChatList() {
        try {
            this.chats = await API.chat.list();
            const searchInput = document.getElementById('search-chat-input');
            let chatsToRender = this.chats;
            if (searchInput && searchInput.value) {
                const term = searchInput.value.toLowerCase();
                chatsToRender = this.chats.filter(c => c.title.toLowerCase().includes(term));
            }
            UI.renderChatList(chatsToRender, this.currentChatId);
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
        UI.autoResize();
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
                UI.appendMessage('assistant', 'خطا: ' + (response.error || 'خطای ناشناخته'));
            }
        } catch (err) {
            UI.removeLoading(loading);
            UI.appendMessage('assistant', 'خطا: ارتباط با سرور برقرار نشد.');
        } finally {
            this.isSending = false;
        }
    },

    async deleteChat(chatId, event) {
        event.stopPropagation();
        if (!confirm('آیا از حذف این گفتگو اطمینان دارید؟')) return;
        try {
            await API.chat.delete(chatId);
            if (this.currentChatId === chatId) {
                this.currentChatId = null;
                UI.clearMessages();
                window.history.pushState({}, '', window.location.pathname);
            }
            this.loadChatList();
        } catch (err) {
            alert('حذف با شکست مواجه شد');
        }
    }
};

window.app = app;
document.addEventListener('DOMContentLoaded', () => app.init());
