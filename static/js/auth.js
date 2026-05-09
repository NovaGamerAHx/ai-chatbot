document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const toggleBtns = document.querySelectorAll('.toggle-btn');

    if (localStorage.getItem(CONFIG.TOKEN_KEY)) {
        window.location.replace('index.html');
        return;
    }

    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            toggleBtns.forEach(b => {
                b.classList.remove('bg-white', 'dark:bg-gray-700', 'shadow-sm', 'text-emerald-600', 'dark:text-emerald-400', 'font-bold');
                b.classList.add('text-gray-500', 'dark:text-gray-400', 'font-medium');
            });
            
            btn.classList.add('bg-white', 'dark:bg-gray-700', 'shadow-sm', 'text-emerald-600', 'dark:text-emerald-400', 'font-bold');
            btn.classList.remove('text-gray-500', 'dark:text-gray-400', 'font-medium');
            
            if (btn.dataset.target === 'login') {
                loginForm.classList.remove('hidden');
                registerForm.classList.add('hidden');
            } else {
                loginForm.classList.add('hidden');
                registerForm.classList.remove('hidden');
            }
        });
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = e.target.username.value.trim();
        const password = e.target.password.value;
        
        const submitBtn = e.target.querySelector('button');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = 'در حال ورود...';
        submitBtn.disabled = true;

        try {
            const user = await API.auth.login(username, password);
            const token = "dummy_token_" + user.id;
            localStorage.setItem(CONFIG.TOKEN_KEY, token);
            localStorage.setItem('chat_username', username);
            window.location.replace('index.html');
        } catch (err) {
            alert('خطا در ورود: ' + (err.message || 'مشکلی پیش آمد'));
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = e.target.username.value.trim();
        const password = e.target.password.value;

        const submitBtn = e.target.querySelector('button');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = 'در حال ثبت نام...';
        submitBtn.disabled = true;

        try {
            await API.auth.register(username, password);
            alert('ثبت نام با موفقیت انجام شد! لطفا وارد شوید.');
            
            document.querySelector('[data-target="login"]').click();
            e.target.reset();
        } catch (err) {
            alert('خطا در ثبت نام: ' + (err.message || 'مشکلی پیش آمد'));
        } finally {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    });
});
