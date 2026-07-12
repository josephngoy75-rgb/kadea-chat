import { apiRequest } from './api.js';

const UI = {
    form: document.getElementById('forgotForm'),
    error: document.getElementById('errorMessage'),
    button: document.getElementById('sendCodeBtn'),
    email: document.getElementById('email')
};

// Format email standard : quelquechose@domaine.extension
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    UI.button.innerHTML = state ? '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...' : "Envoyer le code";
};

const sendResetCode = async (email) => {
    const apiResult = await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
    });
    if (!apiResult.status) throw new Error(apiResult.body.message || "Impossible d'envoyer le code.");
    return apiResult.body;
};

const handleSubmit = async (e) => {
    e.preventDefault();
    const email = UI.email.value.trim();

    if (!email) return displayStatus("Veuillez entrer votre adresse email.");
    if (!EMAIL_REGEX.test(email)) return displayStatus("Adresse email invalide.");

    try {
        setLoading(true);
        displayStatus(null);

        const result = await sendResetCode(email);
        console.log('Réponse de /auth/forgot-password :', result);

        // Transmission de l'email à la page suivante (pour l'affichage uniquement, le code fait foi côté API)
        localStorage.setItem('resetPasswordEmail', email);

        // Certaines API de test renvoient directement le code dans la réponse
        // quand aucun service d'envoi d'email n'est réellement configuré.
        const debugCode = result?.data?.code || result?.data?.resetCode || result?.code;

        if (debugCode) {
            displayStatus(`Code généré : ${debugCode} (aucun email requis). Redirection...`, true);
        } else {
            displayStatus(result?.message || "Code envoyé ! Vérifiez votre boîte mail (et vos spams). Redirection...", true);
        }

        setTimeout(() => {
            window.location.href = 'reset-password.html';
        }, debugCode ? 4000 : 1500);
        // Pas de setLoading(false) ici : le bouton reste désactivé le temps de la redirection

    } catch (err) {
        displayStatus(err.message);
        setLoading(false);
    }
};

UI.form.addEventListener('submit', handleSubmit);