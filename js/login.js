const API_URL = 'https://kadea-chat-api.onrender.com/auth/login';
const API_KEY = 'wksp_4dfecb20c70ac622983ae8356d95ff8a';

const UI = {
    form: document.getElementById('loginForm'),
    error: document.getElementById('errorMessage'),
    button: document.getElementById('loginBtn'),
    email: document.getElementById('email'),
    pass: document.getElementById('password'),
    toggle: document.getElementById('toggleLoginPass')
};

const loginUser = async (credentials) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
        body: JSON.stringify(credentials)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Identifiants incorrects");
    return data;
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
        
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));

        // 2. Feedback et Redirection
        displayStatus("Connexion réussie ! Ravie de vous revoir.", true);
        setTimeout(() => {
            window.location.href = 'chat.html';
        }, 1500);

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
    UI.button.innerHTML = state ? "Connexion..." : "Login";
};

// Toggle Password
UI.toggle.addEventListener('click', () => {
    const isPass = UI.pass.type === 'password';
    UI.pass.type = isPass ? 'text' : 'password';
    UI.toggle.querySelector('i').classList.toggle('fa-eye');
    UI.toggle.querySelector('i').classList.toggle('fa-eye-slash');
});

UI.form.addEventListener('submit', handleSubmit);