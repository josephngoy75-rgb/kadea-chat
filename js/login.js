import { apiRequest } from './api.js';

const t = (key, vars) => window.KadeaI18n.t(key, vars);

const UI = {
    form: document.getElementById('loginForm'),
    error: document.getElementById('errorMessage'),
    button: document.getElementById('loginBtn'),
    email: document.getElementById('email'),
    pass: document.getElementById('password'),
    toggle: document.getElementById('toggleLoginPass')
};

const loginUser = async (credentials) => {
    const apiResult = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
    });
    if (!apiResult.status) throw new Error(apiResult.body.message || t('login.defaultError'));
    return apiResult.body;
};

const handleSubmit = async (e) => {
    e.preventDefault();
    
    const credentials = {
        email: UI.email.value.trim(),
        password: UI.pass.value
    };

try {
        setLoading(true);
        displayStatus(null);

        const result = await loginUser(credentials);
        
        // On vérifie si result.data existe pour éviter de faire planter l'app
        if (result.data && result.data.token) {
            localStorage.setItem('token', result.data.token);
            localStorage.setItem('user', JSON.stringify(result.data.user));
            const user = result.data.user || {};
            const userId = user.id || user._id;
            if (userId) {
                localStorage.setItem('lastUserId', userId);
                if (user.fullName) localStorage.setItem(`myFullName_${userId}`, user.fullName);
                if (user.avatarUrl) localStorage.setItem(`myAvatarUrl_${userId}`, user.avatarUrl);
            }

            displayStatus(t('login.success'), true);
            
            setTimeout(() => {
                window.location.href = 'chat.html';
            }, 1500);
        } else {
            throw new Error(t('login.serverError'));
        }

    } catch (err) {
        displayStatus(err.message);
    } finally {
        setLoading(false);
    }
};

const displayStatus = (msg, isSuccess = false) => {
    if (!msg) { UI.error.classList.add('hidden'); return; }
    UI.error.textContent = (isSuccess ? "✅ " : "⚠️ ") + msg;
    UI.error.classList.remove('hidden');
    UI.error.className = isSuccess 
        ? "bg-green-50 text-green-600 p-3 rounded-xl text-xs mb-4 border border-green-100 text-center font-bold"
        : "bg-red-50 text-red-600 p-3 rounded-xl text-xs mb-4 border border-red-100 text-center";
};

const setLoading = (state) => {
    UI.button.disabled = state;
    UI.button.innerHTML = state ? `<span>${t('login.loadingLabel')}</span>` : `<span data-i18n="login.button">${t('login.button')}</span>`;
};

// Toggle Password
UI.toggle.addEventListener('click', () => {
    const isPass = UI.pass.type === 'password';
    UI.pass.type = isPass ? 'text' : 'password';
    UI.toggle.querySelector('i').classList.toggle('fa-eye');
    UI.toggle.querySelector('i').classList.toggle('fa-eye-slash');
});

UI.form.addEventListener('submit', handleSubmit);
