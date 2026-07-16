/**
 * PROJET KADEA CHAT - PAGE COMMUNAUTÉ
 * Mentor : NovaWeb Studio
 */

import { apiRequest } from './api.js';
const TOKEN = localStorage.getItem('token');

let allUsers = [];
let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (!TOKEN) { window.location.href = 'login.html'; return; }

    // 1. Charger Joseph d'abord
    await fetchCurrentUser();
    // 2. Charger tout le monde
    await fetchAllUsers();

    // 3. Barre de recherche
    document.getElementById('user-search').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = allUsers.filter(u => u.fullName.toLowerCase().includes(query));
        renderAlphabeticalList(filtered);
    });
});

// Empêche l'injection HTML (XSS) quand on affiche du texte venant de l'API
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = String(str ?? "");
    return div.innerHTML;
}

// Notification interne à l'app (même logique que chat.js)
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

async function fetchCurrentUser() {
    try {
        const apiResult = await apiRequest('/auth/me');
        const result = apiResult.body;
        if (apiResult.status) {
            currentUser = result.data.user;
            const userId = currentUser.id || currentUser._id;
            if (currentUser && currentUser.fullName) {
                localStorage.setItem(`myFullName_${userId}`, currentUser.fullName);
                localStorage.setItem('lastUserId', userId);
            }
        }
        else showToast("Impossible de charger votre profil.", 'error');
    } catch (err) {
        console.error(err);
        showToast("Erreur réseau : profil indisponible.", 'error');
    }
}

async function fetchAllUsers() {
    try {
        const apiResult = await apiRequest('/users');
        const result = apiResult.body;
        
        if (apiResult.status) {
            allUsers = result.data.users || result.data;
            // On enlève Joseph de la liste
            allUsers = allUsers.filter(u => String(u.id || u._id) !== String(currentUser.id));
            
            renderRecentActive(allUsers.slice(0, 10)); // 10 premiers en haut
            renderAlphabeticalList(allUsers); // Tout le monde en bas
        } else {
            showToast("Impossible de charger la liste des membres.", 'error');
        }
    } catch (err) {
        console.error(err);
        showToast("Erreur réseau : membres indisponibles.", 'error');
    }
}

// SECTION HORIZONTALE (STYLE MESSENGER)
function renderRecentActive(users) {
    const container = document.getElementById('recent-users');
    if (!container) return;
    container.innerHTML = "";

    users.forEach(u => {
        // Point vert si en ligne, sinon gris
        const statusColor = u.isOnline ? 'bg-green-500' : 'bg-slate-300';
        const safeName = escapeHtml(u.fullName || "??");

        container.insertAdjacentHTML('beforeend', `
            <div onclick="startChat('${u.id || u._id}', '${String(u.fullName).replace(/'/g, "\\'")}')" 
                 class="flex flex-col items-center gap-2 cursor-pointer flex-shrink-0 transition-transform active:scale-90">
                <div class="relative">
                    <div class="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/30 border-2 border-white dark:border-slate-700 shadow-sm dark:shadow-none flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm uppercase">
                        ${escapeHtml((u.fullName || "??").substring(0, 2))}
                    </div>
                    <span class="absolute bottom-0.5 right-0.5 w-4 h-4 ${statusColor} border-2 border-white dark:border-slate-900 rounded-full"></span>
                </div>
                <span class="text-[10px] font-semibold text-slate-600 dark:text-slate-400 w-16 truncate text-center">${escapeHtml(u.fullName.split(' ')[0])}</span>
            </div>
        `);
    });
}

// SECTION VERTICALE (A-Z)
function renderAlphabeticalList(users) {
    const container = document.getElementById('all-users-list');
    if (!container) return;
    container.innerHTML = "";

    const sorted = [...users].sort((a, b) => a.fullName.localeCompare(b.fullName));
    let lastLetter = "";

    sorted.forEach(u => {
        const currentLetter = u.fullName.charAt(0).toUpperCase();
        const statusColor = u.isOnline ? 'bg-green-500' : 'bg-slate-300';

        if (currentLetter !== lastLetter) {
            lastLetter = currentLetter;
            container.insertAdjacentHTML('beforeend', `
                <div class="bg-slate-50/50 dark:bg-slate-800/50 px-5 py-2 text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">${escapeHtml(currentLetter)}</div>
            `);
        }

        container.insertAdjacentHTML('beforeend', `
            <div onclick="startChat('${u.id || u._id}', '${String(u.fullName).replace(/'/g, "\\'")}')" 
                 class="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition border-b border-slate-50 dark:border-slate-800">
                <div class="relative">
                    <div class="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-xs uppercase">
                        ${escapeHtml((u.fullName || "??").substring(0, 2))}
                    </div>
                    <span class="absolute bottom-0 right-0 w-2.5 h-2.5 ${statusColor} border-2 border-white dark:border-slate-900 rounded-full"></span>
                </div>
                <div class="flex-1">
                    <h4 class="font-bold text-slate-800 dark:text-slate-100 text-sm">${escapeHtml(u.fullName)}</h4>
                    <p class="text-[10px] ${u.isOnline ? 'text-green-500 font-bold' : 'text-slate-400'}">${ u.isOnline ? 'En ligne' : 'Hors-ligne'}</p>
                </div>
                <i class="fa-solid fa-chevron-right text-[10px] text-slate-200 dark:text-slate-600"></i>
            </div>
        `);
    });
}

// CRÉATION (SI BESOIN) ET REDIRECTION IMMÉDIATE VERS LE CHAT
window.startChat = async function(userId, userName) {
    try {
        // 1. Vérifie si une conversation existe déjà avec cet utilisateur (évite les doublons)
        const convApiResult = await apiRequest('/conversations');
        const convResult = convApiResult.body;
        let convId = null;

        if (convApiResult.status) {
            const myId = String(currentUser?.id || currentUser?._id);
            const existing = (convResult.data.conversations || []).find(conv =>
                conv.participants?.some(p => String(p.userId || p.id || p._id) === String(userId)) &&
                conv.participants?.some(p => String(p.userId || p.id || p._id) === myId)
            );
            if (existing) convId = existing.id || existing._id;
        }

        // 2. Sinon, on la crée
        if (!convId) {
            const apiResult = await apiRequest('/conversations', {
                method: 'POST',
                body: JSON.stringify({ type: "private", participantIds: [userId] })
            });
            const result = apiResult.body;
            if (!apiResult.status) {
                showToast("Impossible de démarrer la conversation.", 'error');
                return;
            }
            convId = result.data.id || result.data._id;
        }

        // 3. Transmission des infos à la page chat pour ouverture immédiate
        localStorage.setItem('autoOpenConvId', convId);
        localStorage.setItem('autoOpenConvName', userName);
        window.location.href = `chat.html`;
    } catch (err) {
        console.error(err);
        showToast("Erreur réseau : impossible de démarrer la conversation.", 'error');
    }
}