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
        textarea.style.height = textarea.scrollHeight + 'px';
    },

    renderChatList(chats, activeChatId) {
        this.elements.chatList.innerHTML = '';
        chats.forEach(chat => {
            const li = document.createElement('li');
            li.className = `chat-item ${chat.id === activeChatId ? 'active' : ''}`;
            
            // استفاده از آیکون SVG مدرن برای چت و دکمه حذف (سطل زباله مینیمال)
            li.innerHTML = `
                <span class="chat-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                </span>
                <span class="chat-title">${escapeHtml(chat.title)}</span>
                <button class="delete-chat-btn" onclick="app.deleteChat(${chat.id}, event)" title="Delete Chat">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            `;
            li.onclick = () => app.loadChat(chat.id);
            this.elements.chatList.appendChild(li);
        });
    },

    appendMessage(role, content, citations = []) {
        // حذف صفحه خوش‌آمدگویی در صورت وجود
        const welcomeScreen = this.elements.messagesContainer.querySelector('.welcome-screen');
        if (welcomeScreen) {
            welcomeScreen.remove();
        }

        const div = document.createElement('div');
        div.className = `message ${role}`;
        
        const firstChar = content.trim()[0];
        const isRTL = isPersian(firstChar);
        const rtlClass = isRTL ? 'rtl' : '';

        let citationsHtml = '';
        if (citations && citations.length > 0) {
            citationsHtml = `<div class="citations-list">`;
            citations.forEach(c => {
                citationsHtml += `
                    <a href="${c.url}" target="_blank" class="citation-card">
                        <div class="citation-index">Source ${c.ref_index}</div>
                        <div class="citation-info">
                            <div class="citation-title">${escapeHtml(c.title)}</div>
                        </div>
                    </a>
                `;
            });
            citationsHtml += `</div>`;
        }

        let processedContent = parseMarkdown(content);
        
        if (citations) {
            citations.forEach(c => {
                const regex = new RegExp(`\\[${c.ref_index}\\]`, 'g');
                processedContent = processedContent.replace(
                    regex, 
                    `<a href="${c.url}" target="_blank" class="ref-link">[${c.ref_index}]</a>`
                );
            });
        }

        let actionsHtml = '';
        if (role === 'assistant') {
            const safeContent = encodeURIComponent(content).replace(/'/g, "%27");
            // استفاده از آیکون SVG مدرن برای دکمه کپی
            actionsHtml = `
                <div class="message-actions">
                    <button class="copy-btn" onclick="copyToClipboard(decodeURIComponent('${safeContent}'), this)" title="Copy Response">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                </div>
            `;
        }

        div.innerHTML = `
            ${citationsHtml}
            <div class="message-content ${rtlClass}">${processedContent}</div>
            ${actionsHtml}
        `;
        
        this.elements.messagesContainer.appendChild(div);
        this.scrollToBottom();
    },

    clearMessages() {
        this.elements.messagesContainer.innerHTML = `
            <div class="welcome-screen">
                <h1>AI Chat Assistant</h1>
                <p>Start a new conversation...</p>
            </div>
        `;
        this.elements.messageInput.style.height = 'auto';
    },

    showLoading() {
        // حذف صفحه خوش‌آمدگویی پیش از نمایش لودینگ
        const welcomeScreen = this.elements.messagesContainer.querySelector('.welcome-screen');
        if (welcomeScreen) {
            welcomeScreen.remove();
        }

        const div = document.createElement('div');
        div.className = 'message assistant loading-msg';
        div.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
        this.elements.messagesContainer.appendChild(div);
        this.scrollToBottom();
        return div;
    },

    removeLoading(element) {
        if (element) element.remove();
    },

    scrollToBottom() {
        this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
    },
    
    toggleWebSearch(isActive) {
        if (isActive) {
            this.elements.webToggle.classList.add('active');
        } else {
            this.elements.webToggle.classList.remove('active');
        }
    }
};
