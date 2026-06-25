const app = {
    currentChatId: null,
    isWebSearch: false,
    isSending: false,
    chats: [],
    rankerMethod: localStorage.getItem('ranker_method') || 'none',

    async init() {
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
            const rankerBtn = document.getElementById('ranker-toggle');
            if (rankerBtn) {
                if (this.isWebSearch) {
                    rankerBtn.classList.remove('hidden');
                } else {
                    rankerBtn.classList.add('hidden');
                    this.closeRankerDropdown();
                }
            }
        });

        const rankerBtn = document.getElementById('ranker-toggle');
        if (rankerBtn) {
            rankerBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleRankerDropdown();
            });
        }

        document.addEventListener('click', (e) => {
            this.closeRankerDropdown();
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

    toggleRankerDropdown() {
        let dropdown = document.getElementById('ranker-dropdown');
        if (dropdown) {
            dropdown.remove();
            return;
        }

        const rankerBtn = document.getElementById('ranker-toggle');
        if (!rankerBtn) return;

        const rect = rankerBtn.getBoundingClientRect();

        dropdown = document.createElement('div');
        dropdown.id = 'ranker-dropdown';
        dropdown.className = 'fixed bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl shadow-slate-200/50 dark:shadow-none z-50 py-1.5 min-w-[160px] animate-in fade-in duration-150';
        dropdown.style.top = (rect.bottom + 8) + 'px';
        dropdown.style.right = (window.innerWidth - rect.right) + 'px';

        const options = [
            { value: 'none', label: 'بدون رنکر' },
            { value: 'cohere', label: 'Cohere' },
            { value: 'jina', label: 'Jina' },
            { value: 'mix', label: 'میکس' }
        ];

        options.forEach(opt => {
            const item = document.createElement('button');
            item.className = `w-full flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors ${this.rankerMethod === opt.value ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 font-bold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`;
            item.innerHTML = `${this.rankerMethod === opt.value ? '<i data-lucide="check" class="w-3.5 h-3.5"></i>' : '<span class="w-3.5"></span>'}<span>${opt.label}</span>`;
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this.rankerMethod = opt.value;
                localStorage.setItem('ranker_method', opt.value);
                this.updateRankerButtonLabel();
                this.closeRankerDropdown();
            });
            dropdown.appendChild(item);
        });

        document.body.appendChild(dropdown);
        lucide.createIcons();
    },

    closeRankerDropdown() {
        const dropdown = document.getElementById('ranker-dropdown');
        if (dropdown) dropdown.remove();
    },

    updateRankerButtonLabel() {
        const label = document.getElementById('ranker-label');
        if (!label) return;
        const labels = { none: 'بدون رنکر', cohere: 'Cohere', jina: 'Jina', mix: 'میکس' };
        label.textContent = labels[this.rankerMethod] || 'بدون رنکر';
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
            const response = await API.chat.send(this.currentChatId, text, this.isWebSearch, this.rankerMethod);
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