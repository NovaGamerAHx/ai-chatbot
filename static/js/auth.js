document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const toggleBtns = document.querySelectorAll('.toggle-btn');

    // اگر توکن دارد، مستقیم برود داخل
    if (localStorage.getItem(CONFIG.TOKEN_KEY)) {
        window.location.href = 'index.html';
        return;
    }

    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (btn.dataset.target === 'login') {
                loginForm.style.display = 'flex';
                registerForm.style.display = 'none';
            } else {
                loginForm.style.display = 'none';
                registerForm.style.display = 'flex';
            }
        });
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = e.target.username.value;
        const password = e.target.password.value;
        
        const submitBtn = e.target.querySelector('button');
        submitBtn.innerText = 'Logging in...';
        submitBtn.disabled = true;

        try {
            const user = await API.auth.login(username, password);
            
            // === تغییر مهم: ساخت فرمت دقیق توکن و ذخیره نام کاربری ===
            const token = `dummy_token_${user.id}`;
            localStorage.setItem(CONFIG.TOKEN_KEY, token);
            localStorage.setItem('chat_username', username); // ذخیره نام کاربری
            
            window.location.href = 'index.html';
        } catch (err) {
            alert('Login failed: ' + (err.detail || err.message));
            submitBtn.innerText = 'Log In';
            submitBtn.disabled = false;
        }
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = e.target.username.value;
        const password = e.target.password.value;

        const submitBtn = e.target.querySelector('button');
        submitBtn.innerText = 'Creating...';
        submitBtn.disabled = true;

        try {
            await API.auth.register(username, password);
            alert('Registered successfully! Please login.');
            // سوییچ به تب لاگین
            toggleBtns[0].click();
            submitBtn.innerText = 'Sign Up';
            submitBtn.disabled = false;
        } catch (err) {
            alert('Registration failed: ' + (err.detail || err.message));
            submitBtn.innerText = 'Create Account';
            submitBtn.disabled = false;
        }
    });
});