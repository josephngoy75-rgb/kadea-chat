// --- 1. CONFIGURATION ---
const API_URL = "https://kadea-chat-api.onrender.com";
const API_KEY = "wksp_4dfecb20c70ac622983ae8356d95ff8a";
const TOKEN = localStorage.getItem('token');

let currentUser = null;
let activeConversationId = null;
let isSearching = false; 
let contextTarget = null; // { id, content, isMe } - message ciblé par le menu contextuel
let longPressTimer = null;
let deleteMode = 'conversation'; // 'conversation' | 'message'
let deleteTargetId = null;
let editingMessageId = null; // id du message en cours d'édition (bloque le refresh auto)
let contextConvTarget = null; // { id, name } - conversation ciblée par son menu contextuel
let convLongPressTimer = null;
let suppressConvClick = false; // évite d'ouvrir la conversation juste après un appui long
let cachedConversations = []; // dernière liste chargée, utilisée pour éviter de recréer une conversation existante

// Empêche l'injection HTML (XSS) quand on affiche du texte venant de l'utilisateur/API
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = String(str ?? "");
    return div.innerHTML;
}

// Notification interne à l'app (remplace alert()/confirm() natifs du navigateur)
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

// --- ARCHIVAGE LOCAL (pas de route API dédiée : géré via localStorage) ---
function getArchivedIds() {
    try { return JSON.parse(localStorage.getItem('archivedConversationIds') || '[]'); }
    catch { return []; }
}

function archiveConversation(id) {
    if (!id) return;
    const archived = getArchivedIds();
    const strId = String(id);
    if (!archived.includes(strId)) {
        archived.push(strId);
        localStorage.setItem('archivedConversationIds', JSON.stringify(archived));
    }
    showToast('Conversation archivée.', 'success');
    window.location.href = 'archiver.html';
}

// --- 2. INITIALISATION ---
document.addEventListener('DOMContentLoaded', async () => {
    if (!TOKEN) { window.location.href = 'login.html'; return; }
    
    await loadUserProfile();
    await loadConversations();

    // OUVERTURE AUTOMATIQUE
    const autoId = localStorage.getItem('autoOpenConvId');
    const autoName = localStorage.getItem('autoOpenConvName');
    if (autoId && autoName) {
        window.openConversation(autoId, autoName);
        localStorage.removeItem('autoOpenConvId');
        localStorage.removeItem('autoOpenConvName');
    }

    // RECHERCHE
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query.length > 0) { isSearching = true; triggerSearch(query); }
            else { isSearching = false; loadConversations(); }
        });
    }

    // ENVOI
    document.getElementById('send-btn').onclick = sendMessage;
    document.getElementById('message-input').onkeypress = (e) => {
        if (e.key === 'Enter') { e.preventDefault(); sendMessage(); }
    };

    // BOUTONS NAVIGATION
    document.getElementById('back-to-list').onclick = () => {
        document.getElementById('sidebar-mid').classList.remove('hidden');
        document.getElementById('chat-window').classList.add('hidden');
        document.getElementById('chat-window').classList.remove('flex');
        document.getElementById('mobile-nav').classList.remove('hidden');
        activeConversationId = null;
        resetChatToEmptyState();
    };

    document.getElementById('header-archive-btn').onclick = () => { if (activeConversationId) archiveConversation(activeConversationId); };
    document.getElementById('header-delete-btn').onclick = () => { if (activeConversationId) window.openDeleteModal('conversation', activeConversationId); };
    document.getElementById('confirm-delete-btn').onclick = handleConfirmDelete;

    // Menu "3 points" (mobile) regroupant Archiver / Supprimer
    document.getElementById('header-more-btn').onclick = (e) => {
        e.stopPropagation();
        document.getElementById('header-more-menu').classList.toggle('hidden');
    };
    document.addEventListener('click', () => {
        document.getElementById('header-more-menu')?.classList.add('hidden');
    });
    document.getElementById('header-more-archive').onclick = () => {
        document.getElementById('header-more-menu').classList.add('hidden');
        if (activeConversationId) archiveConversation(activeConversationId);
    };
    document.getElementById('header-more-delete').onclick = () => {
        document.getElementById('header-more-menu').classList.add('hidden');
        if (activeConversationId) window.openDeleteModal('conversation', activeConversationId);
    };

    document.getElementById('gear-btn').onclick = () => window.location.href = 'profile.html';

    initMessageContextMenu();
    initConvContextMenu();

    // REFRESH AUTO
    setInterval(() => { 
        if (!isSearching) loadConversations(); 
        if (activeConversationId) silentRefreshMessages(); 
    }, 4000);
});

// --- 3. FONCTIONS API ---

async function loadUserProfile() {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: { 'x-api-key': API_KEY, 'Authorization': `Bearer ${TOKEN}` }
        });
        const result = await response.json();
        if (response.ok) {
            currentUser = result.data.user;
            if (currentUser && currentUser.fullName) {
                localStorage.setItem('myFullName', currentUser.fullName);
            }
            document.getElementById('user-fullname-display').textContent = currentUser.fullName;
            const avatarImg = document.getElementById('user-avatar-img');
            if (avatarImg) {
                avatarImg.src = localStorage.getItem('myAvatarUrl') || currentUser.avatarUrl || 'https://i.pravatar.cc/100?u=me';
            }
        } else {
            showToast("Impossible de charger votre profil.", 'error');
        }
    } catch (err) {
        console.error(err);
        showToast("Erreur réseau : profil indisponible.", 'error');
    }
}

async function loadConversations() {
    if (isSearching) return;
    try {
        const response = await fetch(`${API_URL}/conversations`, {
            headers: { 'x-api-key': API_KEY, 'Authorization': `Bearer ${TOKEN}` }
        });
        const result = await response.json();
        if (response.ok) {
            cachedConversations = result.data.conversations || [];
            renderConversations(cachedConversations);
        }
        else showToast("Impossible de charger les conversations.", 'error');
    } catch (err) {
        console.error(err);
        showToast("Erreur réseau : conversations indisponibles.", 'error');
    }
}

// --- 4. ACTIONS ---

window.createNewConversation = async function(userId, userName) {
    // Si une conversation avec cet utilisateur existe déjà, on l'ouvre directement (pas de doublon)
    const myId = String(currentUser?.id || currentUser?._id);
    const existing = cachedConversations.find(conv =>
        conv.participants?.some(p => String(p.userId || p.id || p._id) === String(userId)) &&
        conv.participants?.some(p => String(p.userId || p.id || p._id) === myId)
    );
    if (existing) {
        isSearching = false;
        document.getElementById('search-input').value = "";
        await loadConversations();
        window.openConversation(existing.id || existing._id, userName);
        return;
    }

    try {
        const response = await fetch(`${API_URL}/conversations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY, 'Authorization': `Bearer ${TOKEN}` },
            body: JSON.stringify({ type: "private", participantIds: [userId] })
        });
        const result = await response.json();
        if (response.ok) {
            isSearching = false; 
            document.getElementById('search-input').value = "";
            await loadConversations();
            const newId = result.data.id || result.data._id;
            window.openConversation(newId, userName);
        } else {
            showToast("Impossible de créer la conversation.", 'error');
        }
    } catch (err) {
        console.error(err);
        showToast("Erreur réseau : conversation impossible à créer.", 'error');
    }
}

// Réaffiche l'écran d'accueil (aucune conversation sélectionnée)
function resetChatToEmptyState() {
    document.getElementById('chat-content').classList.add('hidden');
    document.getElementById('chat-content').classList.remove('flex');
    document.getElementById('chat-empty-state').classList.remove('hidden');
    document.getElementById('messages-container').innerHTML = "";
    document.getElementById('chat-contact-name').textContent = "Sélectionnez un contact";
}

window.openConversation = async function(convId, title) {
    if (suppressConvClick) { suppressConvClick = false; return; }
    if (!convId || convId === 'undefined') return;
    activeConversationId = convId;

    // Bascule vers la vue conversation (masque l'écran d'accueil)
    document.getElementById('chat-empty-state').classList.add('hidden');
    document.getElementById('chat-content').classList.remove('hidden');
    document.getElementById('chat-content').classList.add('flex');

    if (window.innerWidth < 768) {
        document.getElementById('sidebar-mid').classList.add('hidden');
        document.getElementById('mobile-nav').classList.add('hidden');
        document.getElementById('chat-window').classList.remove('hidden');
        document.getElementById('chat-window').classList.add('flex');
    }
    
    document.getElementById('chat-contact-name').textContent = title;
    document.getElementById('contact-initials').textContent = String(title).substring(0, 2).toUpperCase();

    try {
        const response = await fetch(`${API_URL}/conversations/${convId}`, {
            headers: { 'x-api-key': API_KEY, 'Authorization': `Bearer ${TOKEN}` }
        });
        const result = await response.json();
        if (response.ok && result.data) {
            const myId = String(currentUser.id || currentUser._id);
            const other = result.data.participants?.find(p => String(p.id || p._id) !== myId);
            updateOnlineStatus(other ? other.isOnline : false);
            renderMessages(result.data.messages || []);
            document.getElementById('message-input').focus(); // curseur direct dans le champ de saisie
        } else {
            showToast("Cette conversation est introuvable.", 'error');
        }
    } catch (err) {
        console.error(err);
        showToast("Erreur réseau : conversation indisponible.", 'error');
    }
}

async function sendMessage() {
    const input = document.getElementById('message-input');
    const content = input.value.trim();
    if (!content || !activeConversationId) return;

    try {
        const res = await fetch(`${API_URL}/conversations/${activeConversationId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY, 'Authorization': `Bearer ${TOKEN}` },
            body: JSON.stringify({ content })
        });
        if (!res.ok) throw new Error('Échec de l\'envoi');
        input.value = "";
        await silentRefreshMessages();
        loadConversations();
    } catch (err) {
        console.error(err);
        showToast("Le message n'a pas pu être envoyé.", 'error');
    }
}

// --- 5. RENDU ---

function renderConversations(conversations) {
    const container = document.getElementById('conversations-list');
    if (!container || isSearching) return;
    const archivedIds = getArchivedIds();
    const visibleConversations = conversations.filter(conv => !archivedIds.includes(String(conv.id || conv._id)));
    let html = "";
    if (archivedIds.length > 0) {
        html += `
            <a href="archiver.html" class="md:hidden flex items-center gap-4 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition border-b border-slate-50 dark:border-slate-800">
                <div class="w-10 h-10 flex items-center justify-center">
                    <i class="fa-solid fa-box-archive text-slate-500 dark:text-slate-400 text-lg"></i>
                </div>
                <h4 class="font-semibold text-slate-800 dark:text-slate-100 text-[13px] flex-1">Archivées</h4>
            </a>`;
    }
    
    if (visibleConversations.length === 0) {
        html += '<p class="p-8 text-center text-[10px] text-slate-300 dark:text-slate-600 italic">Aucune conversation.</p>';
    }
    container.innerHTML = html;

    visibleConversations.forEach(conv => {
        const myId = String(currentUser.id || currentUser._id);
        const other = conv.participants?.find(p => String(p.userId || p.id || p._id) !== myId);
        let name = other ? (other.user?.fullName || other.fullName) : "Utilisateur";
        const id = conv.id || conv._id;
        const lastMsg = conv.lastMessage?.content || "Discussion vide";
        const date = conv.lastMessage ? new Date(conv.lastMessage.createdAt) : new Date(conv.createdAt);
        const timeStr = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        const safeName = escapeHtml(name);
        container.insertAdjacentHTML('beforeend', `
            <div onclick="window.openConversation('${id}', '${name.replace(/'/g, "\\'")}')" 
                 data-conv-id="${id}" data-conv-name="${name.replace(/"/g, '&quot;')}"
                 class="conv-item flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition border-b border-slate-50 dark:border-slate-800 ${activeConversationId === id ? 'bg-slate-50 dark:bg-slate-800 border-l-4 border-blue-600' : ''}">
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

function renderMessages(messages) {
    const container = document.getElementById('messages-container');
    if (!container) return;
    const msgsArray = Array.isArray(messages) ? messages : (messages.messages || []);
    container.innerHTML = '<div class="flex justify-center mb-6"><span class="bg-slate-50 dark:bg-slate-800 text-slate-400 text-[9px] font-bold px-3 py-1 rounded-full uppercase">Aujourd\'hui</span></div>';
    msgsArray.forEach(msg => {
        const isMe = String(msg.senderId) === String(currentUser.id || currentUser._id);
        const msgId = msg.id || msg._id;
        const time = new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        container.insertAdjacentHTML('beforeend', `<div class="flex ${isMe ? 'justify-end' : 'justify-start'} w-full mb-2" data-message-id="${msgId}" data-is-me="${isMe}"><div class="max-w-[75%]"><div class="bubble-content ${isMe ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl rounded-tl-none'} p-2.5 shadow-sm dark:shadow-none"><p class="msg-text text-[12px] leading-relaxed font-medium">${escapeHtml(msg.content)}</p></div><span class="text-[8px] text-slate-300 dark:text-slate-600 mt-1 block ${isMe ? 'text-right' : ''}">${time}</span></div></div>`);
    });
    container.scrollTop = container.scrollHeight;
}

// --- 6. HELPERS ---

async function triggerSearch(query) {
    try {
        const res = await fetch(`${API_URL}/users`, { headers: { 'x-api-key': API_KEY, 'Authorization': `Bearer ${TOKEN}` } });
        const result = await res.json();
        const found = (result.data?.users || result.data || []).filter(u => u.fullName.toLowerCase().includes(query.toLowerCase()) && String(u.id || u._id) !== String(currentUser.id));
        const container = document.getElementById('conversations-list');
        if (container) {
            container.innerHTML = '<div class="p-3 text-[9px] font-bold text-blue-600 uppercase bg-blue-50/30 dark:bg-blue-900/20">Résultats :</div>';
            found.forEach(u => {
                const safeName = String(u.fullName).replace(/'/g, "\\'");
                container.insertAdjacentHTML('beforeend', `<div onclick="window.createNewConversation('${u.id || u._id}', '${safeName}')" class="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-slate-800 cursor-pointer border-b border-slate-50 dark:border-slate-800"><div class="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase">${String(u.fullName).substring(0,2)}</div><h4 class="font-bold text-slate-800 dark:text-slate-100 text-[11px]">${u.fullName}</h4></div>`);
            });
        }
    } catch (err) { console.error(err); }
}

window.openDeleteModal = (mode = 'conversation', targetId = null) => {
    deleteMode = mode;
    deleteTargetId = targetId;
    const title = document.getElementById('delete-modal-title');
    const text = document.getElementById('delete-modal-text');
    if (mode === 'message') {
        title.textContent = 'Supprimer le message ?';
        text.textContent = 'Cette action est définitive.';
    } else {
        title.textContent = 'Supprimer la discussion ?';
        text.textContent = 'Cette action est définitive.';
    }
    document.getElementById('delete-modal').classList.remove('hidden');
};
window.closeDeleteModal = () => document.getElementById('delete-modal').classList.add('hidden');

async function handleConfirmDelete() {
    if (deleteMode === 'message') {
        await window.deleteMessage(deleteTargetId);
    } else {
        await deleteConversationById(deleteTargetId);
    }
    window.closeDeleteModal();
}

async function deleteConversationById(id) {
    if (!id) return;
    try {
        const res = await fetch(`${API_URL}/conversations/${id}`, { method: 'DELETE', headers: { 'x-api-key': API_KEY, 'Authorization': `Bearer ${TOKEN}` } });
        if (!res.ok) throw new Error('Échec de la suppression de la conversation');
        if (String(activeConversationId) === String(id)) {
            activeConversationId = null;
            resetChatToEmptyState();
            if (window.innerWidth < 768) document.getElementById('back-to-list').click();
        }
        loadConversations();
    } catch (err) {
        console.error(err);
        showToast("Impossible de supprimer la conversation.", 'error');
    }
}

function updateOnlineStatus(isOnline) {
    const dot = document.getElementById('online-dot');
    if (dot) dot.className = `w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-slate-300'}`;
}

async function silentRefreshMessages() {
    if (!activeConversationId || isSearching || editingMessageId) return;
    try {
        const response = await fetch(`${API_URL}/conversations/${activeConversationId}/messages`, { headers: { 'x-api-key': API_KEY, 'Authorization': `Bearer ${TOKEN}` } });
        const result = await response.json();
        renderMessages(Array.isArray(result.data) ? result.data : (result.data?.messages || []));
    } catch (err) { console.error(err); }
}

// --- 7. MENU CONTEXTUEL MESSAGE (clic droit desktop / appui long mobile) ---

function initMessageContextMenu() {
    const container = document.getElementById('messages-container');
    const menu = document.getElementById('msg-context-menu');
    if (!container || !menu) return;

    // Clic droit (desktop)
    container.addEventListener('contextmenu', (e) => {
        const bubble = e.target.closest('[data-message-id]');
        if (!bubble) return;
        e.preventDefault();
        openContextMenu(bubble, e.clientX, e.clientY);
    });

    // Appui long (mobile / tactile)
    container.addEventListener('touchstart', (e) => {
        const bubble = e.target.closest('[data-message-id]');
        if (!bubble) return;
        const touch = e.touches[0];
        longPressTimer = setTimeout(() => {
            openContextMenu(bubble, touch.clientX, touch.clientY);
            if (navigator.vibrate) navigator.vibrate(30);
        }, 500);
    }, { passive: true });
    container.addEventListener('touchend', () => clearTimeout(longPressTimer));
    container.addEventListener('touchmove', () => clearTimeout(longPressTimer));

    // Fermer le menu si on clique/touche ailleurs
    document.addEventListener('click', (e) => {
        if (!menu.contains(e.target)) menu.classList.add('hidden');
    });

    // Actions du menu
    document.getElementById('ctx-edit').onclick = () => {
        menu.classList.add('hidden');
        if (contextTarget) enterEditMode(contextTarget.id, contextTarget.content);
    };
    document.getElementById('ctx-copy').onclick = () => {
        menu.classList.add('hidden');
        if (contextTarget) navigator.clipboard.writeText(contextTarget.content).catch(() => {});
    };
    document.getElementById('ctx-delete').onclick = () => {
        menu.classList.add('hidden');
        if (contextTarget) window.openDeleteModal('message', contextTarget.id);
    };
}

function openContextMenu(bubbleEl, x, y) {
    const menu = document.getElementById('msg-context-menu');
    const isMe = bubbleEl.dataset.isMe === 'true';
    const textEl = bubbleEl.querySelector('.msg-text');

    contextTarget = {
        id: bubbleEl.dataset.messageId,
        content: textEl ? textEl.textContent : "",
        isMe
    };

    // Modifier/Supprimer réservés à mes propres messages ; Copier dispo pour tous
    document.getElementById('ctx-edit').classList.toggle('hidden', !isMe);
    document.getElementById('ctx-delete').classList.toggle('hidden', !isMe);

    // Positionnement en évitant de sortir de l'écran
    const menuWidth = 180, menuHeight = 150;
    menu.style.left = Math.min(x, window.innerWidth - menuWidth) + 'px';
    menu.style.top = Math.min(y, window.innerHeight - menuHeight) + 'px';
    menu.classList.remove('hidden');
}

function enterEditMode(msgId, currentContent) {
    const bubble = document.querySelector(`[data-message-id="${msgId}"] .bubble-content`);
    if (!bubble) return;
    editingMessageId = msgId;
    bubble.innerHTML = `
        <input type="text" class="edit-input w-full bg-transparent text-white placeholder-white/70 text-[12px] outline-none border-b border-white/40 pb-1" value="${escapeHtml(currentContent)}">
        <div class="flex gap-3 mt-1.5 justify-end">
            <i class="fa-solid fa-xmark text-[11px] text-white/80 cursor-pointer hover:text-white"></i>
            <i class="fa-solid fa-check text-[11px] text-white/80 cursor-pointer hover:text-white"></i>
        </div>`;
    const input = bubble.querySelector('.edit-input');
    const [cancelIcon, saveIcon] = bubble.querySelectorAll('.flex.gap-3 i');
    input.focus();
    input.select();

    const save = () => window.saveEditedMessage(msgId, input.value.trim());
    const cancel = () => { editingMessageId = null; silentRefreshMessages(); };

    input.onkeydown = (e) => {
        if (e.key === 'Enter') { e.preventDefault(); save(); }
        if (e.key === 'Escape') cancel();
    };
    saveIcon.onclick = save;
    cancelIcon.onclick = cancel;
}

window.saveEditedMessage = async function(msgId, newContent) {
    if (!newContent) return;
    try {
        const res = await fetch(`${API_URL}/messages/${msgId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY, 'Authorization': `Bearer ${TOKEN}` },
            body: JSON.stringify({ content: newContent })
        });
        if (!res.ok) throw new Error('Échec de la modification');
        editingMessageId = null;
        await silentRefreshMessages();
        loadConversations();
    } catch (err) {
        console.error("Erreur modification message:", err);
        showToast("Impossible de modifier ce message.", 'error');
        editingMessageId = null;
        silentRefreshMessages();
    }
}

window.deleteMessage = async function(msgId) {
    try {
        const res = await fetch(`${API_URL}/messages/${msgId}`, {
            method: 'DELETE',
            headers: { 'x-api-key': API_KEY, 'Authorization': `Bearer ${TOKEN}` }
        });
        if (!res.ok) throw new Error('Échec de la suppression');
        await silentRefreshMessages();
        loadConversations();
    } catch (err) {
        console.error("Erreur suppression message:", err);
        showToast("Impossible de supprimer ce message.", 'error');
    }
}

// --- 8. MENU CONTEXTUEL CONVERSATION (clic droit desktop / appui long mobile) ---

function initConvContextMenu() {
    const container = document.getElementById('conversations-list');
    const menu = document.getElementById('conv-context-menu');
    if (!container || !menu) return;

    // Clic droit (desktop)
    container.addEventListener('contextmenu', (e) => {
        const item = e.target.closest('.conv-item');
        if (!item) return;
        e.preventDefault();
        openConvContextMenu(item, e.clientX, e.clientY);
    });

    // Appui long (mobile / tactile)
    container.addEventListener('touchstart', (e) => {
        const item = e.target.closest('.conv-item');
        if (!item) return;
        const touch = e.touches[0];
        convLongPressTimer = setTimeout(() => {
            suppressConvClick = true; // empêche l'ouverture de la conversation au relâchement du doigt
            openConvContextMenu(item, touch.clientX, touch.clientY);
            if (navigator.vibrate) navigator.vibrate(30);
        }, 500);
    }, { passive: true });
    container.addEventListener('touchend', () => clearTimeout(convLongPressTimer));
    container.addEventListener('touchmove', () => clearTimeout(convLongPressTimer));

    // Fermer le menu si on clique/touche ailleurs
    document.addEventListener('click', (e) => {
        if (!menu.contains(e.target)) menu.classList.add('hidden');
    });

    document.getElementById('conv-ctx-archive').onclick = () => {
        menu.classList.add('hidden');
        if (contextConvTarget) archiveConversation(contextConvTarget.id);
    };
    document.getElementById('conv-ctx-delete').onclick = () => {
        menu.classList.add('hidden');
        if (contextConvTarget) window.openDeleteModal('conversation', contextConvTarget.id);
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