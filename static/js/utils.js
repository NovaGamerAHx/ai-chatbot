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

// تابع جدید برای تشخیص شروع متن با حروف فارسی جهت راست‌چین کردن
function isPersianText(text) {
    if (!text) return false;
    // بررسی می‌کند که آیا اولین حرف الفبایی در متن فارسی/عربی است یا خیر
    const persianRegex = /^[^a-zA-Z]*[\u0600-\u06FF]/;
    return persianRegex.test(text.trim());
}