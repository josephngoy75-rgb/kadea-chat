const API_URL = 'https://kadea-chat-api.onrender.com/auth/reset-password';
const API_KEY = 'wksp_4dfecb20c70ac622983ae8356d95ff8a';

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
    { test: (pwd) => pwd.length >= 8, message: "Le mot de passe doit contenir au moins 8 caractères." },
    { test: (pwd) => /[A-Z]/.test(pwd), message: "Le mot de passe doit contenir au moins une majuscule." },
    { test: (pwd) => /[0-9]/.test(pwd), message: "Le mot de passe doit contenir au moins un chiffre." },
    { test: (pwd) => /[^A-Za-z0-9]/.test(pwd), message: "Le mot de passe doit contenir au moins un caractère spécial." }
];

document.addEventListener('DOMContentLoaded', () => {
    const email = localStorage.getItem('resetPasswordEmail');
    if (UI.targetEmail) UI.targetEmail.textContent = email || "votre adresse email";
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
    UI.button.innerHTML = state ? '<i class="fas fa-spinner fa-spin"></i> Validation...' : "Réinitialiser le mot de passe";
};

const validateForm = (data) => {
    if (!data.code || !data.newPassword || !data.confirmPassword) return "Veuillez remplir tous les champs.";
    if (!/^\d{6}$/.test(data.code)) return "Le code doit contenir 6 chiffres.";
    if (data.newPassword !== data.confirmPassword) return "Les mots de passe ne correspondent pas.";

    const failedRule = PASSWORD_RULES.find(rule => !rule.test(data.newPassword));
    if (failedRule) return failedRule.message;

    return null;
};

const resetPassword = async (payload) => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
        body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Code invalide ou expiré.");
    return data;
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
        displayStatus("Mot de passe réinitialisé avec succès ! Redirection...", true);
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