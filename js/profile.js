// --- CONFIGURATION ---
import { apiRequest } from './api.js';
const TOKEN = localStorage.getItem('token');

let currentUserData = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (!TOKEN) { window.location.href = 'login.html'; return; }

    initTheme();
    await loadFullProfile();
    initHeaderMenu();
    initEditProfileModal();
    initChangePasswordModal();
    initLogoutModal();
    initAvatarModal();
});

// --- HELPERS ---

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = String(str ?? "");
    return div.innerHTML;
}

function showToast(message, type = 'error') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const styles = {
        error: 'bg-red-500 text-white',
        success: 'bg-green-600 text-white',
        info: 'bg-slate-800 text-white'
    };
    const toast = document.createElement('div');
    toast.className = `pointer-events-auto max-w-xs w-full sm:w-auto text-center text-[11px] font-semibold px-4 py-2.5 rounded-xl shadow-lg dark:shadow-none modal-animate ${styles[type] || styles.info}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.transition = 'opacity 0.3s';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- PRÉFÉRENCES LOCALES SCOPÉES PAR UTILISATEUR ---
// (l'API ne gère pas l'email affiché différemment de l'email de connexion,
//  donc on le garde en local — mais lié à l'id de l'utilisateur pour éviter
//  qu'un autre compte connecté sur ce même navigateur n'hérite de ces données)

function getProfileOverrides(userId) {
    try { return JSON.parse(localStorage.getItem(`profileOverrides_${userId}`) || '{}'); }
    catch { return {}; }
}

function setProfileOverrides(userId, partial) {
    const current = getProfileOverrides(userId);
    Object.keys(partial).forEach(key => {
        if (partial[key]) current[key] = partial[key];
    });
    localStorage.setItem(`profileOverrides_${userId}`, JSON.stringify(current));
}

function getMyAvatarUrl(userId, apiAvatarUrl) {
    return localStorage.getItem(`myAvatarUrl_${userId}`) || apiAvatarUrl || 'https://i.pravatar.cc/150?u=me';
}

// --- THÈME (mode sombre / clair) ---

function applyTheme(theme) {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    const icon = document.getElementById('theme-icon');
    const label = document.getElementById('theme-label');
    if (icon) {
        icon.classList.toggle('fa-moon', theme !== 'dark');
        icon.classList.toggle('fa-sun', theme === 'dark');
    }
    if (label) label.textContent = theme === 'dark' ? 'Mode clair' : 'Mode sombre';
}

function initTheme() {
    applyTheme(localStorage.getItem('theme') || 'light');
}

// --- CHARGEMENT DU PROFIL ---

async function loadFullProfile() {
    try {
        const apiResult = await apiRequest('/auth/me');
        const result = apiResult.body;

        if (apiResult.status && result.data?.user) {
            const user = result.data.user;
            currentUserData = user;
            const userId = user.id || user._id;
            if (user && user.fullName) {
                localStorage.setItem(`myFullName_${userId}`, user.fullName);
                localStorage.setItem('lastUserId', userId);
            }
            const overrides = getProfileOverrides(userId);

            document.getElementById('profile-name').textContent = user.fullName;
            document.getElementById('profile-email').textContent = overrides.email || user.email;
            document.getElementById('detail-username').textContent = user.fullName.toLowerCase().replace(/\s/g, '_');
            document.getElementById('detail-phone').textContent = user.bio || "Non renseigné";

            const avatarUrl = getMyAvatarUrl(userId, user.avatarUrl);
            document.getElementById('user-avatar-img').src = avatarUrl;
            document.getElementById('avatar-preview-img').src = avatarUrl;

            const date = new Date(user.createdAt);
            const formattedDate = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
            document.getElementById('member-since').innerHTML = `<i class="fa-solid fa-circle-check mr-1"></i> Member since ${escapeHtml(formattedDate)}`;
        } else {
            showToast("Impossible de charger votre profil.", 'error');
        }
    } catch (err) {
        console.error("Erreur profil:", err);
        showToast("Erreur réseau : profil indisponible.", 'error');
    }
}

// --- MENU "3 POINTS" DE L'EN-TÊTE ---

function initHeaderMenu() {
    const moreBtn = document.getElementById('header-more-btn');
    const moreMenu = document.getElementById('header-more-menu');
    if (!moreBtn || !moreMenu) return;

    moreBtn.onclick = (e) => {
        e.stopPropagation();
        moreMenu.classList.toggle('hidden');
    };
    document.addEventListener('click', () => moreMenu.classList.add('hidden'));

    document.getElementById('theme-toggle-btn').onclick = () => {
        const current = localStorage.getItem('theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', next);
        applyTheme(next);
        moreMenu.classList.add('hidden');
    };
}

// --- MODAL : MODIFIER LE PROFIL ---

function initEditProfileModal() {
    const modal = document.getElementById('edit-profile-modal');

    document.getElementById('edit-profile-btn').onclick = () => {
        const userId = currentUserData?.id || currentUserData?._id;
        const overrides = getProfileOverrides(userId);
        document.getElementById('edit-fullname').value = currentUserData?.fullName || '';
        document.getElementById('edit-email').value = overrides.email || currentUserData?.email || '';
        document.getElementById('edit-phone').value = currentUserData?.bio || '';
        modal.classList.remove('hidden');
    };
    document.getElementById('cancel-edit-profile-btn').onclick = () => modal.classList.add('hidden');

    document.getElementById('save-profile-btn').onclick = async () => {
        const fullName = document.getElementById('edit-fullname').value.trim();
        const email = document.getElementById('edit-email').value.trim();
        const phone = document.getElementById('edit-phone').value.trim();
        const userId = currentUserData?.id || currentUserData?._id;

        if (!fullName) { showToast("Le nom complet est requis.", 'error'); return; }
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast("Adresse email invalide.", 'error'); return; }

        try {
            // Le téléphone est stocké côté serveur dans le champ "bio" (documenté par l'API)
            // => persistant sur tous les appareils, contrairement à un stockage local.
            const apiResult = await apiRequest('/users/me', {
                method: 'PATCH',
                body: JSON.stringify({ fullName, bio: phone })
            });
            if (!apiResult.status) throw new Error('Échec de la mise à jour');

            // L'email affiché reste local : l'API ne permet pas de changer l'email de connexion.
            setProfileOverrides(userId, { email });
            showToast('Profil mis à jour.', 'success');
            modal.classList.add('hidden');
            await loadFullProfile();
        } catch (err) {
            console.error(err);
            showToast("Impossible de mettre à jour le profil.", 'error');
        }
    };
}

// --- MODAL : CHANGER LE MOT DE PASSE ---

// Mêmes règles que sur inscription/réinitialisation : cohérence dans toute l'app
const PASSWORD_RULES = [
    { test: (pwd) => pwd.length >= 8, message: "Le mot de passe doit contenir au moins 8 caractères." },
    { test: (pwd) => /[A-Z]/.test(pwd), message: "Le mot de passe doit contenir au moins une majuscule." },
    { test: (pwd) => /[0-9]/.test(pwd), message: "Le mot de passe doit contenir au moins un chiffre." },
    { test: (pwd) => /[^A-Za-z0-9]/.test(pwd), message: "Le mot de passe doit contenir au moins un caractère spécial." }
];

function initChangePasswordModal() {
    const modal = document.getElementById('change-password-modal');

    function resetForm() {
        document.getElementById('pwd-old').value = '';
        document.getElementById('pwd-new').value = '';
        document.getElementById('pwd-confirm').value = '';
    }

    document.getElementById('change-password-btn').onclick = () => {
        resetForm();
        modal.classList.remove('hidden');
    };
    document.getElementById('cancel-pwd-btn').onclick = () => modal.classList.add('hidden');

    document.getElementById('confirm-new-pwd-btn').onclick = async () => {
        const oldPassword = document.getElementById('pwd-old').value;
        const newPassword = document.getElementById('pwd-new').value;
        const confirmPwd = document.getElementById('pwd-confirm').value;

        if (!oldPassword || !newPassword || !confirmPwd) { showToast("Veuillez remplir tous les champs.", 'error'); return; }
        if (newPassword !== confirmPwd) { showToast("Les mots de passe ne correspondent pas.", 'error'); return; }

        const failedRule = PASSWORD_RULES.find(rule => !rule.test(newPassword));
        if (failedRule) { showToast(failedRule.message, 'error'); return; }

        try {
            const apiResult = await apiRequest('/auth/change-password', {
                method: 'POST',
                body: JSON.stringify({ oldPassword, newPassword })
            });
            if (!apiResult.status) throw new Error(apiResult.body?.message || 'Échec du changement de mot de passe');
            showToast('Mot de passe modifié avec succès.', 'success');
            modal.classList.add('hidden');
        } catch (err) {
            console.error(err);
            showToast(err.message || "Mot de passe actuel incorrect.", 'error');
        }
    };
}

// --- MODAL : DÉCONNEXION ---

function initLogoutModal() {
    const modal = document.getElementById('logout-modal');

    document.getElementById('logout-btn').onclick = (e) => {
        e.preventDefault();
        modal.classList.remove('hidden');
    };
    document.getElementById('cancel-logout-btn').onclick = () => modal.classList.add('hidden');

    document.getElementById('confirm-logout-btn').onclick = () => {
        // On ne retire que les données de session : le thème et la photo de profil
        // restent disponibles à la prochaine connexion sur cet appareil.
        localStorage.removeItem('token');
        localStorage.removeItem('autoOpenConvId');
        localStorage.removeItem('autoOpenConvName');
        window.location.href = 'index.html';
    };
}

// --- MODAL : PHOTO DE PROFIL (style WhatsApp) ---

function initAvatarModal() {
    const modal = document.getElementById('avatar-modal');
    const fileInput = document.getElementById('avatar-file-input');

    document.getElementById('avatar-click-zone').onclick = () => modal.classList.remove('hidden');
    document.getElementById('close-avatar-modal-btn').onclick = () => modal.classList.add('hidden');
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });

    document.getElementById('avatar-edit-btn').onclick = () => fileInput.click();

    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const userId = currentUserData?.id || currentUserData?._id;
        try {
            const dataUrl = await resizeImageToDataUrl(file, 300);
            localStorage.setItem(`myAvatarUrl_${userId}`, dataUrl);
            document.getElementById('user-avatar-img').src = dataUrl;
            document.getElementById('avatar-preview-img').src = dataUrl;
            showToast('Photo de profil mise à jour.', 'success');

            // Tentative de sauvegarde côté serveur (champ documenté par l'API)
            try {
                const apiResult = await apiRequest('/users/me', {
                    method: 'PATCH',
                    body: JSON.stringify({ avatarUrl: dataUrl })
                });
                if (!apiResult.status) console.warn("Le serveur n'a pas accepté la photo (probablement trop volumineuse) — elle reste sauvegardée sur cet appareil.");
            } catch (err) {
                console.warn("Sauvegarde serveur de la photo impossible, conservée localement uniquement.", err);
            }
        } catch (err) {
            console.error(err);
            showToast("Impossible de charger cette image.", 'error');
        }
    };
}

// Redimensionne l'image choisie (limite la taille avant stockage/envoi)
function resizeImageToDataUrl(file, maxSize = 300) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let { width, height } = img;
                if (width > height) {
                    if (width > maxSize) { height = height * (maxSize / width); width = maxSize; }
                } else {
                    if (height > maxSize) { width = width * (maxSize / height); height = maxSize; }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}