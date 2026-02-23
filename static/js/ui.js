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
        
        // Citations Container
        if (citations && citations.length > 0) {
            const citationsDiv = document.createElement('div');
            citationsDiv.className = 'citations-list';
            
            citations.forEach(c => {
                const card = document.createElement('a');
                card.href = c.url;
                card.target = '_blank';
                card.className = 'citation-card';
                card.innerHTML = `
                    <div class="citation-index">منبع ${c.ref_index}</div>
                    <div class="citation-title">${escapeHtml(c.title)}</div>
                `;
                citationsDiv.appendChild(card);
            });
            div.appendChild(citationsDiv);
        }

        // Message Content
        let processedContent = parseMarkdown(content);
        
        // Replace citation links
        if (citations) {
            citations.forEach(c => {
                processedContent = processedContent.replace(
                    `[${c.ref_index}]`, 
                    `<a href="${c.url}" target="_blank" class="ref-link">[${c.ref_index}]</a>`
                );
            });
        }

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // تشخیص راست‌چین بودن (RTL Detection)
        // اگر متن با کاراکتر فارسی یا عربی شروع شود یا کاراکترهای زیادی داشته باشد
        const firstStrongChar = content.trim().charAt(0);
        const persianRegex = /[\u0600-\u06FF]/;
        
        if (persianRegex.test(firstStrongChar)) {
            contentDiv.style.direction = 'rtl';
            contentDiv.style.textAlign = 'right';
        } else {
            contentDiv.style.direction = 'ltr';
            contentDiv.style.textAlign = 'left';
        }
        
        contentDiv.innerHTML = processedContent;
        div.appendChild(contentDiv);
        
        this.elements.messagesContainer.appendChild(div);
        this.scrollToBottom();
    },

    clearMessages() {
        this.elements.messagesContainer.innerHTML = `
            <div class="welcome-screen">
                <h1>AI Chat Assistant</h1>
                <p>چگونه می‌توانم کمکتان کنم؟</p>
            </div>
        `;
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