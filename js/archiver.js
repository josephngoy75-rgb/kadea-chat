// --- 1. CONFIGURATION ---
const API_URL = "https://kadea-chat-api.onrender.com";
const API_KEY = "wksp_4dfecb20c70ac622983ae8356d95ff8a";
const TOKEN = localStorage.getItem('token');

let currentUser = null;
let contextConvTarget = null; // { id, name } - conversation ciblée par le menu contextuel
let convLongPressTimer = null;
let suppressConvClick = false; // évite d'ouvrir la conversation juste après un appui long
let deleteTargetId = null;

// --- 2. INITIALISATION ---
document.addEventListener('DOMContentLoaded', async () => {
    if (!TOKEN) { window.location.href = 'login.html'; return; }

    await loadUserProfile();
    await loadArchivedConversations();

    document.getElementById('confirm-delete-btn').onclick = handleConfirmDelete;
    initConvContextMenu();
});

// Empêche l'injection HTML (XSS)
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
    toast.className = `pointer-events-auto max-w-xs w-full sm:w-auto text-center text-[11px] font-semibold px-4 py-2.5 rounded-xl shadow-lg modal-animate ${styles[type] || styles.info}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.transition = 'opacity 0.3s';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- 3. ARCHIVAGE LOCAL (partagé avec chat.js via localStorage) ---
function getArchivedIds() {
    try { return JSON.parse(localStorage.getItem('archivedConversationIds') || '[]'); }
    catch { return []; }
}

function unarchiveConversation(id) {
    if (!id) return;
    const strId = String(id);
    const archived = getArchivedIds().filter(a => a !== strId);
    localStorage.setItem('archivedConversationIds', JSON.stringify(archived));
    showToast('Conversation désarchivée.', 'success');
    loadArchivedConversations();
}

// --- 4. FONCTIONS API ---

async function loadUserProfile() {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: { 'x-api-key': API_KEY, 'Authorization': `Bearer ${TOKEN}` }
        });
        const result = await response.json();
        if (response.ok) currentUser = result.data.user;
        else showToast("Impossible de charger votre profil.", 'error');
    } catch (err) {
        console.error(err);
        showToast("Erreur réseau : profil indisponible.", 'error');
    }
}

async function loadArchivedConversations() {
    const archivedIds = getArchivedIds();
    const container = document.getElementById('archived-list');
    if (archivedIds.length === 0) {
        container.innerHTML = '<p class="p-8 text-center text-[11px] text-slate-300 dark:text-slate-600 italic">Aucune conversation archivée.</p>';
        return;
    }
    try {
        const response = await fetch(`${API_URL}/conversations`, {
            headers: { 'x-api-key': API_KEY, 'Authorization': `Bearer ${TOKEN}` }
        });
        const result = await response.json();
        if (!response.ok) { showToast("Impossible de charger les archives.", 'error'); return; }
        const all = result.data.conversations || [];
        const archived = all.filter(conv => archivedIds.includes(String(conv.id || conv._id)));
        renderArchivedList(archived);
    } catch (err) {
        console.error(err);
        showToast("Erreur réseau : archives indisponibles.", 'error');
    }
}

async function deleteConversationById(id) {
    try {
        const res = await fetch(`${API_URL}/conversations/${id}`, {
            method: 'DELETE',
            headers: { 'x-api-key': API_KEY, 'Authorization': `Bearer ${TOKEN}` }
        });
        if (!res.ok) throw new Error('Échec de la suppression de la conversation');
        // On nettoie aussi la référence locale d'archivage devenue obsolète
        const strId = String(id);
        const archived = getArchivedIds().filter(a => a !== strId);
        localStorage.setItem('archivedConversationIds', JSON.stringify(archived));
        loadArchivedConversations();
    } catch (err) {
        console.error(err);
        showToast("Impossible de supprimer la conversation.", 'error');
    }
}

// --- 5. RENDU ---

function renderArchivedList(conversations) {
    const container = document.getElementById('archived-list');
    if (conversations.length === 0) {
        container.innerHTML = '<p class="p-8 text-center text-[11px] text-slate-300 dark:text-slate-600 italic">Aucune conversation archivée.</p>';
        return;
    }
    container.innerHTML = "";
    conversations.forEach(conv => {
        const myId = String(currentUser.id || currentUser._id);
        const other = conv.participants?.find(p => String(p.userId || p.id || p._id) !== myId);
        const name = other ? (other.user?.fullName || other.fullName) : "Utilisateur";
        const id = conv.id || conv._id;
        const lastMsg = conv.lastMessage?.content || "Discussion vide";
        const date = conv.lastMessage ? new Date(conv.lastMessage.createdAt) : new Date(conv.createdAt);
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const safeName = escapeHtml(name);

        container.insertAdjacentHTML('beforeend', `
            <div onclick="window.openArchivedConversation('${id}', '${name.replace(/'/g, "\\'")}')" 
                 data-conv-id="${id}" data-conv-name="${name.replace(/"/g, '&quot;')}"
                 class="conv-item flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition border-b border-slate-50 dark:border-slate-800">
                <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs uppercase">${String(name).substring(0, 2)}</div>
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-baseline mb-0.5">
                        <h4 class="font-bold text-slate-800 dark:text-slate-100 text-[12px] truncate">${safeName}</h4>
                        <span class="text-[9px] text-slate-400">${timeStr}</span>
                    </div>
                    <p class="text-[11px] text-slate-400 truncate">${escapeHtml(lastMsg)}</p>
                </div>
            </div>`);
    });
}

// --- 6. ACTIONS ---

// Ouvre la conversation archivée dans chat.html (elle reste archivée tant qu'on ne la désarchive pas,
// comme sur WhatsApp : consulter une discussion archivée ne la fait pas ressortir automatiquement)
window.openArchivedConversation = function(id, name) {
    if (suppressConvClick) { suppressConvClick = false; return; }
    localStorage.setItem('autoOpenConvId', id);
    localStorage.setItem('autoOpenConvName', name);
    window.location.href = 'chat.html';
};

window.openDeleteModal = (id) => {
    deleteTargetId = id;
    document.getElementById('delete-modal').classList.remove('hidden');
};
window.closeDeleteModal = () => document.getElementById('delete-modal').classList.add('hidden');

async function handleConfirmDelete() {
    if (deleteTargetId) await deleteConversationById(deleteTargetId);
    window.closeDeleteModal();
}

// --- 7. MENU CONTEXTUEL (clic droit desktop / appui long mobile) ---

function initConvContextMenu() {
    const container = document.getElementById('archived-list');
    const menu = document.getElementById('conv-context-menu');
    if (!container || !menu) return;

    container.addEventListener('contextmenu', (e) => {
        const item = e.target.closest('.conv-item');
        if (!item) return;
        e.preventDefault();
        openConvContextMenu(item, e.clientX, e.clientY);
    });

    container.addEventListener('touchstart', (e) => {
        const item = e.target.closest('.conv-item');
        if (!item) return;
        const touch = e.touches[0];
        convLongPressTimer = setTimeout(() => {
            suppressConvClick = true;
            openConvContextMenu(item, touch.clientX, touch.clientY);
            if (navigator.vibrate) navigator.vibrate(30);
        }, 500);
    }, { passive: true });
    container.addEventListener('touchend', () => clearTimeout(convLongPressTimer));
    container.addEventListener('touchmove', () => clearTimeout(convLongPressTimer));

    document.addEventListener('click', (e) => {
        if (!menu.contains(e.target)) menu.classList.add('hidden');
    });

    document.getElementById('conv-ctx-unarchive').onclick = () => {
        menu.classList.add('hidden');
        if (contextConvTarget) unarchiveConversation(contextConvTarget.id);
    };
    document.getElementById('conv-ctx-delete').onclick = () => {
        menu.classList.add('hidden');
        if (contextConvTarget) window.openDeleteModal(contextConvTarget.id);
    };
}

function openConvContextMenu(itemEl, x, y) {
    const menu = document.getElementById('conv-context-menu');
    contextConvTarget = { id: itemEl.dataset.convId, name: itemEl.dataset.convName };

    const menuWidth = 180, menuHeight = 110;
    menu.style.left = Math.min(x, window.innerWidth - menuWidth) + 'px';
    menu.style.top = Math.min(y, window.innerHeight - menuHeight) + 'px';
    menu.classList.remove('hidden');
}