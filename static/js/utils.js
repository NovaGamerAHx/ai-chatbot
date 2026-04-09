function parseMarkdown(text) {
    if (typeof marked !== 'undefined') {
        return marked.parse(text);
    }
    return text.replace(/\n/g, '<br>');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fa-IR');
}

function escapeHtml(text) {
    if (!text) return text;
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function isPersian(text) {
    if (!text) return false;
    const persianRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return persianRegex.test(text.charAt(0));
}

async function copyToClipboard(text, btn) {
    try {
        await navigator.clipboard.writeText(text);
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '✅';
        setTimeout(() => {
            if (document.body.contains(btn)) {
                btn.innerHTML = originalHtml;
            }
        }, 2000);
    } catch (err) {
        console.error('Failed to copy', err);
    }
}