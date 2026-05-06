const UI = {
    elements: {
        chatList: document.getElementById('chat-list'),
        messagesContainer: document.getElementById('messages-container'),
        messageInput: document.getElementById('message-input'),
        sendBtn: document.getElementById('send-btn'),
        webToggle: document.getElementById('web-toggle'),
        newChatBtn: document.getElementById('new-chat-btn'),
        chatTitle: document.getElementById('current-chat-title')
    },

    autoResize() {
        const textarea = this.elements.messageInput;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 128) + 'px';
    },

    renderChatList(chats, activeChatId) {
        this.elements.chatList.innerHTML = '';
        chats.forEach(chat => {
            const li = document.createElement('li');
            const isActive = chat.id === activeChatId;
            li.className = `chat-item group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${isActive ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium border border-emerald-100 dark:border-emerald-500/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 border border-transparent'}`;
            
            const firstChar = chat.title.trim()[0] || '';
            const isRTL = typeof isPersian === 'function' ? isPersian(firstChar) : true;
            const dirAttr = isRTL ? 'rtl' : 'ltr';
            const textAlign = isRTL ? 'text-right' : 'text-left';
            
            li.innerHTML = `
                <div class="flex items-center gap-3 overflow-hidden flex-1 px-1">
                    <i data-lucide="message-square" class="w-4 h-4 flex-shrink-0 opacity-70 ${isActive ? 'text-emerald-500' : ''}"></i>
                    <span class="truncate text-sm flex-1 ${textAlign}" dir="${dirAttr}" title="${escapeHtml(chat.title)}">${escapeHtml(chat.title)}</span>
                </div>
                <button class="opacity-0 group-hover:opacity-100 p-1.5 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-lg transition-all z-10 flex-shrink-0" onclick="app.deleteChat(${chat.id}, event)" title="حذف">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            `;
            li.onclick = () => app.loadChat(chat.id);
            this.elements.chatList.appendChild(li);
        });
        lucide.createIcons();
    },

    appendMessage(role, content, citations = []) {
        const welcomeScreen = this.elements.messagesContainer.querySelector('.welcome-screen');
        if (welcomeScreen) {
            welcomeScreen.remove();
        }

        const outerWrapper = document.createElement('div');
        const isUser = role === 'user';
        outerWrapper.className = `flex w-full ${isUser ? 'justify-start' : 'justify-end'} group/msg`;

        const innerContainer = document.createElement('div');
        innerContainer.className = `flex w-full max-w-4xl mx-auto px-6 md:px-12 ${isUser ? 'justify-start' : 'justify-end'}`;

        let displayContent = content;
        let sourcesHtml = '';

        const firstChar = displayContent.trim()[0] || '';
        const isRTL = typeof isPersian === 'function' ? isPersian(firstChar) : true;
        const dirAttr = isRTL ? 'rtl' : 'ltr';
        const textAlignClass = isRTL ? 'text-right' : 'text-left';

        if (citations && citations.length > 0) {
            sourcesHtml += '<div class="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800/60"><h4 class="text-xs font-bold text-gray-400 dark:text-gray-500 mb-3 flex items-center gap-1.5"><i data-lucide="book-open" class="w-3 h-3"></i> منابع یافت شده</h4><div class="flex flex-wrap gap-2">';
            citations.forEach(c => {
                sourcesHtml += `
                    <a href="${c.url}" target="_blank" rel="noopener noreferrer" class="group/ref flex items-center gap-2 max-w-[14rem] p-1.5 pr-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/80 hover:border-emerald-400 dark:hover:border-emerald-500/50 rounded-xl transition-all shadow-sm hover:shadow-md">
                        <div class="relative flex-shrink-0">
                            <span class="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg w-6 h-6 flex items-center justify-center text-[10px] font-black group-hover/ref:bg-emerald-500 group-hover/ref:text-white transition-colors">${c.ref_index}</span>
                            ${c.site_icon ? `<img src="${c.site_icon}" class="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-white dark:border-gray-900" onerror="this.remove()">` : ''}
                        </div>
                        <span class="truncate text-xs font-medium text-gray-600 dark:text-gray-300 group-hover/ref:text-emerald-600 dark:group-hover/ref:text-emerald-400 transition-colors">${escapeHtml(c.title)}</span>
                    </a>
                `;
            });
            sourcesHtml += '</div></div>';
        }

        let processedContent = typeof parseMarkdown === 'function' ? parseMarkdown(displayContent) : displayContent;
        
        if (citations && citations.length > 0) {
            citations.forEach(c => {
                const regex = new RegExp(`\\\[${c.ref_index}\\\]`, 'g');
                processedContent = processedContent.replace(
                    regex, 
                    `<a href="${c.url}" target="_blank" class="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 mx-0.5 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all no-underline shadow-sm align-super" title="${escapeHtml(c.title)}">${c.ref_index}</a>`
                );
            });
        }

        const bubble = document.createElement('div');
        const userClasses = 'bg-gray-100 dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700/80 text-gray-800 dark:text-gray-100 rounded-br-sm rounded-3xl max-w-[85%] md:max-w-[75%] px-5 py-4 shadow-sm';
        const aiClasses = 'bg-transparent text-gray-800 dark:text-gray-100 w-full max-w-[95%] py-2';
        
        bubble.className = `relative ${isUser ? userClasses : aiClasses}`;
        
        const safeContent = encodeURIComponent(displayContent).replace(/'/g, "%27");
        const actionsHtml = `
            <div class="absolute -bottom-6 ${isUser ? 'left-2' : '-left-2'} opacity-0 group-hover/msg:opacity-100 transition-opacity duration-200 z-10">
                <button class="p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-lg text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all transform hover:scale-105" onclick="copyToClipboard(decodeURIComponent('${safeContent}'), this)" title="کپی پیام">
                    <i data-lucide="copy" class="w-4 h-4"></i>
                </button>
            </div>
        `;

        bubble.innerHTML = `
            <div class="prose prose-sm md:prose-base max-w-none text-gray-800 dark:text-gray-200 ${!isUser ? 'dark:prose-invert' : ''} ${textAlignClass} leading-relaxed" dir="${dirAttr}">
                ${processedContent}
            </div>
            ${sourcesHtml}
            ${actionsHtml}
        `;
        
        if(!isUser) outerWrapper.classList.add('mb-4');
        
        innerContainer.appendChild(bubble);
        outerWrapper.appendChild(innerContainer);
        this.elements.messagesContainer.appendChild(outerWrapper);
        
        this.scrollToBottom();
        lucide.createIcons();
    },

    clearMessages() {
        this.elements.messagesContainer.innerHTML = `
            <div class="welcome-screen h-full flex flex-col items-center justify-center text-center space-y-6 text-gray-500">
                <div class="p-5 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 dark:from-emerald-500/20 dark:to-transparent rounded-3xl shadow-sm border border-emerald-500/20 dark:border-emerald-500/10">
                    <i data-lucide="sparkles" class="w-12 h-12 text-emerald-500"></i>
                </div>
                <div class="space-y-2">
                    <h1 class="text-2xl md:text-3xl font-extrabold text-gray-800 dark:text-gray-100">چگونه می‌توانم کمک کنم؟</h1>
                    <p class="text-sm md:text-base text-gray-500 dark:text-gray-400">یک پیام بنویسید تا گفتگو را شروع کنیم.</p>
                </div>
            </div>
        `;
        this.elements.messageInput.style.height = 'auto';
        lucide.createIcons();
    },

    showLoading() {
        const welcomeScreen = this.elements.messagesContainer.querySelector('.welcome-screen');
        if (welcomeScreen) welcomeScreen.remove();

        const wrapper = document.createElement('div');
        wrapper.className = 'flex w-full justify-end group/msg';
        
        const innerContainer = document.createElement('div');
        innerContainer.className = 'flex w-full max-w-4xl mx-auto px-6 md:px-12 justify-end';

        innerContainer.innerHTML = `
            <div class="bg-transparent text-emerald-500 flex gap-2 items-center py-4 px-2">
                <span class="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce"></span>
                <span class="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce" style="animation-delay: 0.15s"></span>
                <span class="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce" style="animation-delay: 0.3s"></span>
            </div>
        `;
        
        wrapper.appendChild(innerContainer);
        this.elements.messagesContainer.appendChild(wrapper);
        this.scrollToBottom();
        return wrapper;
    },

    removeLoading(element) {
        if (element) element.remove();
    },

    scrollToBottom() {
        this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
    },
    
    toggleWebSearch(isActive) {
        if (isActive) {
            this.elements.webToggle.classList.add('text-emerald-600', 'bg-emerald-50', 'dark:bg-emerald-500/10', 'dark:text-emerald-400');
            this.elements.webToggle.classList.remove('text-gray-400', 'dark:text-gray-500');
        } else {
            this.elements.webToggle.classList.remove('text-emerald-600', 'bg-emerald-50', 'dark:bg-emerald-500/10', 'dark:text-emerald-400');
            this.elements.webToggle.classList.add('text-gray-400', 'dark:text-gray-500');
        }
    }
};
