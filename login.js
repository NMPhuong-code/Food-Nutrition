document.addEventListener('DOMContentLoaded', () => {
    // Buttons and Modal elements
    const adminRoleBtn = document.getElementById('admin-role-btn');
    const userRoleBtn = document.getElementById('user-role-btn');
    const authModal = document.getElementById('auth-modal');
    const closeModalBtn = document.querySelector('.close-button');

    // View elements
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');
    const showRegisterLink = document.getElementById('show-register-view');
    const showLoginLink = document.getElementById('show-login-view');
    
    // Form elements
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginTitle = document.getElementById('login-title');
    
    // Captcha elements for User role
    const captchaSection = document.getElementById('captcha-section');
    const captchaCodeSpan = document.getElementById('captcha-code');
    const refreshCaptchaBtn = document.getElementById('refresh-captcha');
    const captchaInput = document.getElementById('captcha-input');
    
    // Error message elements
    const loginErrorMsg = document.getElementById('login-error-msg');
    const registerErrorMsg = document.getElementById('register-error-msg');

    // Password Toggle elements
    const togglePasswordIcons = document.querySelectorAll('.toggle-password');
    
    let currentRole = null;

    // --- UTILITY FUNCTIONS ---
    
    function generateCaptcha() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let captcha = '';
        for (let i = 0; i < 6; i++) {
            captcha += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        captchaCodeSpan.textContent = captcha;
    }

    function validatePassword(password) {
        const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
        return regex.test(password);
    }

    function showModal(role) {
        currentRole = role;
        loginErrorMsg.textContent = '';
        registerErrorMsg.textContent = '';
        loginForm.reset();
        registerForm.reset();
        
        // Reset password fields to type="password"
        document.querySelectorAll('.password-group input').forEach(input => input.type = 'password');
        document.querySelectorAll('.toggle-password').forEach(icon => {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        });
        
        if (role === 'admin') {
            loginTitle.textContent = 'Đăng nhập Admin';
            captchaSection.style.display = 'none';
            document.getElementById('register-link-container').style.display = 'none';
        } else { // role === 'user'
            loginTitle.textContent = 'Đăng nhập User';
            captchaSection.style.display = 'block';
            document.getElementById('register-link-container').style.display = 'block';
            generateCaptcha();
        }
        
        loginView.style.display = 'block';
        registerView.style.display = 'none';
        authModal.style.display = 'flex';
    }

    // --- EVENT LISTENERS ---

    adminRoleBtn.addEventListener('click', () => showModal('admin'));
    userRoleBtn.addEventListener('click', () => showModal('user'));
    closeModalBtn.addEventListener('click', () => authModal.style.display = 'none');
    refreshCaptchaBtn.addEventListener('click', generateCaptcha);

    // Password Toggle Listener
    togglePasswordIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            const passwordInput = icon.previousElementSibling;
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });

    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginView.style.display = 'none';
        registerView.style.display = 'block';
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerView.style.display = 'none';
        loginView.style.display = 'block';
        if (currentRole === 'user') {
            generateCaptcha();
        }
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        loginErrorMsg.textContent = '';
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        let isValid = false;

        if (currentRole === 'admin') {
            if (username === 'admin' && password === '123456') {
                isValid = true;
            } else {
                loginErrorMsg.textContent = 'Tài khoản hoặc mật khẩu Admin không đúng.';
            }
        } else { // currentRole === 'user'
            if (captchaInput.value.toLowerCase() !== captchaCodeSpan.textContent.toLowerCase()) {
                loginErrorMsg.textContent = 'Mã bảo vệ không đúng.';
                generateCaptcha();
                return;
            }
            const users = JSON.parse(localStorage.getItem('nutritionUsers') || '[]');
            const foundUser = users.find(user => user.username === username && user.password === password);
            if (foundUser) {
                isValid = true;
            } else {
                loginErrorMsg.textContent = 'Tài khoản hoặc mật khẩu không đúng.';
            }
        }
        
        if (isValid) {
            sessionStorage.setItem('userRole', currentRole);
            sessionStorage.setItem('loggedInUser', username);
            window.location.href = 'index.html';
        }
    });

    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        registerErrorMsg.textContent = '';
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;

        if (password !== confirmPassword) {
            registerErrorMsg.textContent = 'Mật khẩu nhập lại không khớp.';
            return;
        }

        if (!validatePassword(password)) {
            registerErrorMsg.textContent = 'Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ và số.';
            return;
        }

        const users = JSON.parse(localStorage.getItem('nutritionUsers') || '[]');
        const existingUser = users.find(user => user.username === username);

        if (existingUser) {
            registerErrorMsg.textContent = 'Tài khoản này đã tồn tại.';
            return;
        }

        users.push({ username, password });
        localStorage.setItem('nutritionUsers', JSON.stringify(users));

        alert('Tạo tài khoản thành công! Vui lòng đăng nhập.');
        
        registerView.style.display = 'none';
        loginView.style.display = 'block';
        generateCaptcha();
    });
});

