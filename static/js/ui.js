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
            li.innerHTML = `
                <span class="chat-icon">💬</span>
                <span class="chat-title">${escapeHtml(chat.title)}</span>
                <button class="delete-chat-btn" onclick="app.deleteChat(${chat.id}, event)">×</button>
            `;
            li.onclick = () => app.loadChat(chat.id);
            this.elements.chatList.appendChild(li);
        });
    },

    appendMessage(role, content, citations = []) {
        const div = document.createElement('div');
        div.className = `message ${role}`;
        
        const firstChar = content.trim()[0];
        const isRTL = /[\u0600-\u06FF]/.test(firstChar);
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

        div.innerHTML = `
            ${citationsHtml}
            <div class="message-content ${rtlClass}">${processedContent}</div>
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
