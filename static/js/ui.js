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
            li.className = `chat-item group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${isActive ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-bold border border-blue-100 dark:border-blue-900/50 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-transparent'}`;
            
            const firstChar = chat.title.trim()[0] || '';
            const isRTL = typeof isPersian === 'function' ? isPersian(firstChar) : true;
            const dirAttr = isRTL ? 'rtl' : 'ltr';
            const textAlign = isRTL ? 'text-right' : 'text-left';
            
            li.innerHTML = `
                <div class="flex items-center gap-3 overflow-hidden flex-1 px-1">
                    <i data-lucide="message-square" class="w-4 h-4 flex-shrink-0 opacity-70 ${isActive ? 'text-blue-500' : ''}"></i>
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

        const firstChar = displayContent.trim()[0] || '';
        const isRTL = typeof isPersian === 'function' ? isPersian(firstChar) : true;
        const dirAttr = isRTL ? 'rtl' : 'ltr';
        const textAlignClass = isRTL ? 'text-right' : 'text-left';

        let sourcesHtml = '';
        if (citations && citations.length > 0) {
            const sourcesId = 'sources-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            sourcesHtml += `
            <div class="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                <button onclick="toggleSources('${sourcesId}')" class="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors group/src mb-3">
                    <i data-lucide="book-open" class="w-3 h-3"></i>
                    <span>منابع یافت شده</span>
                    <svg id="chevron-${sourcesId}" class="w-3 h-3 transition-transform duration-300 rotate-180" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
                </button>
                <div id="${sourcesId}" class="flex flex-wrap gap-2 transition-all duration-300 overflow-hidden">
            `;
            citations.forEach(c => {
                sourcesHtml += `
                    <a href="${c.url}" target="_blank" rel="noopener noreferrer" class="group/ref flex items-center gap-2 max-w-[14rem] p-1.5 pr-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 hover:border-blue-400 dark:hover:border-blue-500/50 rounded-xl transition-all shadow-sm hover:shadow-md">
                        <div class="relative flex-shrink-0">
                            <span class="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg w-6 h-6 flex items-center justify-center text-[10px] font-black group-hover/ref:bg-blue-600 group-hover/ref:text-white transition-colors">${c.ref_index}</span>
                            ${c.site_icon ? `<img src="${c.site_icon}" class="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-white dark:border-slate-900" onerror="this.remove()">` : ''}
                        </div>
                        <span class="truncate text-xs font-medium text-slate-600 dark:text-slate-300 group-hover/ref:text-blue-600 dark:group-hover/ref:text-blue-400 transition-colors">${escapeHtml(c.title)}</span>
                    </a>
                `;
            });
            sourcesHtml += '</div></div>';
        }

        let processedContent = typeof parseMarkdown === 'function' ? parseMarkdown(displayContent) : displayContent;
        
        if (citations && citations.length > 0) {
            citations.forEach(c => {
                const regex = new RegExp(`\\[${c.ref_index}\\]`, 'g');
                processedContent = processedContent.replace(
                    regex, 
                    `<a href="${c.url}" target="_blank" class="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 mx-0.5 text-[10px] font-bold rounded-md bg-blue-50 text-blue-600 border border-blue-200 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-all no-underline shadow-sm align-super" title="${escapeHtml(c.title)}">${c.ref_index}</a>`
                );
            });
        }

        const bubble = document.createElement('div');
        const userClasses = 'bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 rounded-br-sm rounded-3xl max-w-[85%] md:max-w-[75%] px-5 py-4 shadow-sm';
        const aiClasses = 'bg-transparent text-slate-800 dark:text-slate-100 w-full max-w-[95%] py-2';
        
        bubble.className = `relative ${isUser ? userClasses : aiClasses}`;
        
        const safeContent = encodeURIComponent(displayContent).replace(/'/g, "%27");

        const actionsHtml = `
            <div class="flex items-center gap-1.5 mt-4 ${isUser ? 'justify-end' : 'justify-end'}">
                ${!isUser ? `
                <button class="tts-btn flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-lg text-[11px] font-medium text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200 dark:hover:border-blue-800/40 transition-all shadow-sm" onclick="playTTS(decodeURIComponent('${safeContent}'), this)" title="خوانش متن">
                    <i data-lucide="volume-2" class="w-3.5 h-3.5"></i>
                    <span>خوانش</span>
                </button>
                ` : ''}
                <button class="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-lg text-[11px] font-medium text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200 dark:hover:border-blue-800/40 transition-all shadow-sm" onclick="copyToClipboard(decodeURIComponent('${safeContent}'), this)" title="کپی پیام">
                    <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                    <span>کپی</span>
                </button>
            </div>
        `;

        bubble.innerHTML = `
            <div class="prose prose-sm md:prose-base max-w-none text-slate-800 dark:text-slate-200 ${!isUser ? 'dark:prose-invert' : ''} ${textAlignClass} leading-relaxed" dir="${dirAttr}">
                ${processedContent}
            </div>
            ${actionsHtml}
            ${sourcesHtml}
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
            <div class="welcome-screen h-full flex flex-col items-center justify-center text-center space-y-6 text-slate-500">
                <div class="p-5 bg-gradient-to-br from-blue-600/10 to-green-700/5 dark:from-blue-600/20 dark:to-transparent rounded-3xl shadow-sm border border-blue-500/20 dark:border-blue-500/10">
                    <i data-lucide="sparkles" class="w-12 h-12 text-blue-600"></i>
                </div>
                <div class="space-y-2">
                    <h1 class="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100">چگونه می‌توانم کمک کنم؟</h1>
                    <p class="text-sm md:text-base text-slate-500 dark:text-slate-400">یک پیام بنویسید تا گفتگو را شروع کنیم.</p>
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
            <div class="bg-transparent text-blue-600 flex gap-2 items-center py-4 px-2">
                <span class="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"></span>
                <span class="w-2.5 h-2.5 bg-green-600 rounded-full animate-bounce" style="animation-delay: 0.15s"></span>
                <span class="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0.3s"></span>
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
            this.elements.webToggle.classList.add('text-blue-600', 'bg-blue-50', 'dark:bg-blue-500/10', 'dark:text-blue-400');
            this.elements.webToggle.classList.remove('text-slate-400', 'dark:text-slate-500');
        } else {
            this.elements.webToggle.classList.remove('text-blue-600', 'bg-blue-50', 'dark:bg-blue-500/10', 'dark:text-blue-400');
            this.elements.webToggle.classList.add('text-slate-400', 'dark:text-slate-500');
        }
    }
};

function toggleSources(sourcesId) {
    const container = document.getElementById(sourcesId);
    const chevron = document.getElementById('chevron-' + sourcesId);
    if (!container) return;
    if (container.style.maxHeight && container.style.maxHeight !== '0px') {
        container.style.maxHeight = '0px';
        container.style.opacity = '0';
        container.style.marginBottom = '0';
        if (chevron) chevron.classList.remove('rotate-180');
    } else {
        container.style.maxHeight = container.scrollHeight + 'px';
        container.style.opacity = '1';
        container.style.marginBottom = '';
        if (chevron) chevron.classList.add('rotate-180');
    }
}
window.toggleSources = toggleSources;

window.currentAudio = null;
window.currentAudioBtn = null;

function pcmToWav(pcmBytes, sampleRate = 24000, numChannels = 1) {
    const dataLength = pcmBytes.length;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);
    const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);
    const wavBytes = new Uint8Array(buffer);
    wavBytes.set(pcmBytes, 44);
    return wavBytes;
}

async function playTTS(text, btn) {
    if (window.currentAudio) {
        window.currentAudio.pause();
        window.currentAudio = null;
        if (window.currentAudioBtn) {
            const spanEl = window.currentAudioBtn.querySelector('span');
            if (spanEl) spanEl.textContent = 'خوانش';
            window.currentAudioBtn.innerHTML = '<i data-lucide="volume-2" class="w-3.5 h-3.5"></i><span>خوانش</span>';
            lucide.createIcons();
        }
        if (window.currentAudioBtn === btn) {
            window.currentAudioBtn = null;
            return;
        }
    }

    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<span class="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin inline-block"></span><span>در حال بارگذاری...</span>';
    window.currentAudioBtn = btn;

    const cleanText = text.replace(/[#*`~_\[\]()\-+]/g, '').replace(/\\/g, '').trim();

    try {
        const token = localStorage.getItem(CONFIG.TOKEN_KEY);
        const response = await fetch(`${CONFIG.API_BASE_URL}/chat/tts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ text: cleanText })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || 'Error from TTS API');
        }

        const data = await response.json();
        const binary = atob(data.audio_data);
        const pcmBytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            pcmBytes[i] = binary.charCodeAt(i);
        }

        let sampleRate = 24000;
        const rateMatch = data.mime_type.match(/rate=(\d+)/);
        if (rateMatch) {
            sampleRate = parseInt(rateMatch[1], 10);
        }

        const wavBytes = pcmToWav(pcmBytes, sampleRate, 1);
        const blob = new Blob([wavBytes], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);

        const audio = new Audio(url);
        window.currentAudio = audio;
        btn.innerHTML = '<i data-lucide="square" class="w-3.5 h-3.5 text-red-500 animate-pulse"></i><span class="text-red-500">توقف</span>';
        lucide.createIcons();

        audio.play();

        audio.onended = () => {
            URL.revokeObjectURL(url);
            btn.innerHTML = originalHtml;
            lucide.createIcons();
            window.currentAudio = null;
            window.currentAudioBtn = null;
        };

        audio.onerror = () => {
            URL.revokeObjectURL(url);
            btn.innerHTML = originalHtml;
            lucide.createIcons();
            window.currentAudio = null;
            window.currentAudioBtn = null;
            alert('خطا در پخش صدا');
        };

    } catch (err) {
        btn.innerHTML = originalHtml;
        lucide.createIcons();
        window.currentAudio = null;
        window.currentAudioBtn = null;
        alert('خطا در تولید صدا: ' + err.message);
    }
}

window.playTTS = playTTS;