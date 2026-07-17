import { apiRequest } from './api.js';

const t = (key, vars) => window.KadeaI18n.t(key, vars);

// --- 2. SÉLECTEURS UI ---
const UI = {
    form: document.getElementById('registerForm'),
    error: document.getElementById('errorMessage'),
    button: document.getElementById('submitBtn'),
    inputs: {
        name: document.getElementById('fullname'),
        email: document.getElementById('email'),
        pass: document.getElementById('password'),
        confirm: document.getElementById('confirmPassword')
    },
    toggles: {
        pass: document.getElementById('togglePass'), 
        confirm: document.getElementById('toggleConfirm') 
    }
};

// Format email standard : quelquechose@domaine.extension
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateForm = (data) => {
    if (!data.fullName || !data.email || !data.password || !data.confirmPassword) {
        return t('register.fillAllFields');
    }

    if (!EMAIL_REGEX.test(data.email)) {
        return t('register.invalidEmail');
    }

    if (data.password !== data.confirmPassword) {
        return t('register.passwordMismatch');
    }

    // Règles du mot de passe : au moins 8 caractères, 1 majuscule, 1 chiffre, 1 caractère spécial
    const PASSWORD_RULES = [
        { test: (pwd) => pwd.length >= 8, key: 'pwd.rule8' },
        { test: (pwd) => /[A-Z]/.test(pwd), key: 'pwd.ruleUpper' },
        { test: (pwd) => /[0-9]/.test(pwd), key: 'pwd.ruleDigit' },
        { test: (pwd) => /[^A-Za-z0-9]/.test(pwd), key: 'pwd.ruleSpecial' }
    ];
    const failedRule = PASSWORD_RULES.find(rule => !rule.test(data.password));
    if (failedRule) return t(failedRule.key);

    return null;
};

//  SERVICES API 
const registerUser = async (userData) => {
    const apiResult = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
    });
    if (!apiResult.status) throw new Error(apiResult.body.message || t('register.defaultError'));
    return apiResult.body;
};


const displayStatus = (msg, isSuccess = false) => {
    if (!msg) {
        UI.error.classList.add('hidden');
        return;
    }
    UI.error.textContent = (isSuccess ? "✅ " : "⚠️ ") + msg;
    UI.error.classList.remove('hidden');
    
    UI.error.className = isSuccess 
        ? "bg-green-50 text-green-600 p-3 rounded-xl text-xs mb-4 border border-green-100 text-center font-bold"
        : "bg-red-50 text-red-600 p-3 rounded-xl text-xs mb-4 border border-red-100 text-center";
};

const setLoading = (state) => {
    UI.button.disabled = state;
    UI.button.innerHTML = state
        ? `<i class="fas fa-spinner fa-spin"></i> ${t('register.loadingLabel')}`
        : `<span data-i18n="register.button">${t('register.button')}</span> <i class="fa-solid fa-arrow-right text-xs"></i>`;
    UI.button.style.opacity = state ? "0.7" : "1";
};

/**
 * Alterne entre type 'password' et 'text'
 */
const toggleVisibility = (inputElement, iconElement) => {
    const isPassword = inputElement.type === 'password';
    inputElement.type = isPassword ? 'text' : 'password';
    // Change l'icône (œil barré ou non)
    const icon = iconElement.querySelector('i');
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
};

// GESTIONNAIRES D'ÉVÉNEMENTS 

// Soumission du formulaire
const handleSubmit = async (event) => {
    event.preventDefault();

    const formData = { // je reupère les saisies 
        fullName: UI.inputs.name.value.trim(),
        email: UI.inputs.email.value.trim(),
        password: UI.inputs.pass.value,
        confirmPassword: UI.inputs.confirm.value
    };

    const errorValidation = validateForm(formData);
    if (errorValidation) return displayStatus(errorValidation);

    try {
        setLoading(true);
        displayStatus(null); 

        await registerUser(formData);
        
        // FeedBack Succès 
        displayStatus(t('register.success'), true);
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500); // 1,5 secondes pour lire le message

    } catch (err) {
        displayStatus(err.message);
    } finally {
        if (window.location.pathname.includes('register.html')) {
            setLoading(false);
        }
    }
};

// INITIALISATION 

UI.form.addEventListener('submit', handleSubmit);

// Événements pour les yeux (Afficher/Masquer)
UI.toggles.pass.addEventListener('click', () => toggleVisibility(UI.inputs.pass, UI.toggles.pass));
UI.toggles.confirm.addEventListener('click', () => toggleVisibility(UI.inputs.confirm, UI.toggles.confirm));