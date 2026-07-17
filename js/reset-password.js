import { apiRequest } from './api.js';

const t = (key, vars) => window.KadeaI18n.t(key, vars);

const UI = {
    form: document.getElementById('resetForm'),
    error: document.getElementById('errorMessage'),
    button: document.getElementById('resetBtn'),
    code: document.getElementById('code'),
    newPassword: document.getElementById('newPassword'),
    confirmPassword: document.getElementById('confirmPassword'),
    toggleNew: document.getElementById('toggleNewPass'),
    toggleConfirm: document.getElementById('toggleConfirmPass'),
    targetEmail: document.getElementById('target-email')
};

// Mêmes règles que sur la page d'inscription : cohérence dans toute l'app
const PASSWORD_RULES = [
    { test: (pwd) => pwd.length >= 8, key: 'pwd.rule8' },
    { test: (pwd) => /[A-Z]/.test(pwd), key: 'pwd.ruleUpper' },
    { test: (pwd) => /[0-9]/.test(pwd), key: 'pwd.ruleDigit' },
    { test: (pwd) => /[^A-Za-z0-9]/.test(pwd), key: 'pwd.ruleSpecial' }
];

document.addEventListener('DOMContentLoaded', () => {
    const email = localStorage.getItem('resetPasswordEmail');
    if (UI.targetEmail) UI.targetEmail.textContent = email || t('reset.defaultEmail');
});

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
    UI.button.innerHTML = state
        ? `<i class="fas fa-spinner fa-spin"></i> ${t('reset.loadingLabel')}`
        : `<span data-i18n="reset.button">${t('reset.button')}</span>`;
};

const validateForm = (data) => {
    if (!data.code || !data.newPassword || !data.confirmPassword) return t('reset.fillAllFields');
    if (!/^\d{6}$/.test(data.code)) return t('reset.codeInvalid');
    if (data.newPassword !== data.confirmPassword) return t('reset.passwordMismatch');

    const failedRule = PASSWORD_RULES.find(rule => !rule.test(data.newPassword));
    if (failedRule) return t(failedRule.key);

    return null;
};

const resetPassword = async (payload) => {
    const apiResult = await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    if (!apiResult.status) throw new Error(apiResult.body.message || t('reset.defaultError'));
    return apiResult.body;
};

const toggleVisibility = (inputElement, btnElement) => {
    const isPassword = inputElement.type === 'password';
    inputElement.type = isPassword ? 'text' : 'password';
    const icon = btnElement.querySelector('i');
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
};

const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = {
        code: UI.code.value.trim(),
        newPassword: UI.newPassword.value,
        confirmPassword: UI.confirmPassword.value
    };

    const errorValidation = validateForm(formData);
    if (errorValidation) return displayStatus(errorValidation);

    try {
        setLoading(true);
        displayStatus(null);

        await resetPassword({ code: formData.code, newPassword: formData.newPassword });

        localStorage.removeItem('resetPasswordEmail');
        displayStatus(t('reset.success'), true);
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        // Pas de setLoading(false) ici : le bouton reste désactivé le temps de la redirection

    } catch (err) {
        displayStatus(err.message);
        setLoading(false);
    }
};

UI.toggleNew.addEventListener('click', () => toggleVisibility(UI.newPassword, UI.toggleNew));
UI.toggleConfirm.addEventListener('click', () => toggleVisibility(UI.confirmPassword, UI.toggleConfirm));
UI.form.addEventListener('submit', handleSubmit);