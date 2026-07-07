// --- 1. CONFIGURATION ---
const API_URL = "https://kadea-chat-api.onrender.com";
const API_KEY = "wksp_4dfecb20c70ac622983ae8356d95ff8a";
const TOKEN = localStorage.getItem('token');

let currentUser = null;
let activeConversationId = null;

// --- 2. INITIALISATION ---
document.addEventListener('DOMContentLoaded', async () => {
    if (!TOKEN) { window.location.href = 'login.html'; return; }

    await loadUserProfile();
    await loadConversations();

    // Recherche
    document.getElementById('search-input').addEventListener('input', (e) => {
        const query = e.target.value.trim();
        query ? triggerSearch(query) : loadConversations();
    });

    // Envoi
    document.getElementById('send-btn').addEventListener('click', sendMessage);
    document.getElementById('message-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); sendMessage(); }
    });

    // BOUTON RETOUR MOBILE
    document.getElementById('back-to-list').onclick = () => {
        document.getElementById('sidebar-mid').classList.remove('hidden');
        document.getElementById('chat-window').classList.add('hidden');
        document.getElementById('chat-window').classList.remove('flex');
        // On réaffiche la barre WhatsApp
        document.getElementById('mobile-nav').classList.remove('hidden');
        activeConversationId = null;
    };

    // Navigation Profil (PC + Mobile)
    document.getElementById('gear-btn').onclick = () => window.location.href = 'profile.html';
    document.getElementById('gear-mobile').onclick = () => window.location.href = 'profile.html';

    // Refresh Auto
    setInterval(() => {
        if (activeConversationId) silentRefreshMessages();
        loadConversations();
    }, 5000);
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
            document.getElementById('user-fullname-display').textContent = currentUser.fullName;
            if(currentUser.avatarUrl) document.getElementById('user-avatar-img').src = currentUser.avatarUrl;
        }
    } catch (err) { console.error(err); }
}

async function loadConversations() {
    try {
        const response = await fetch(`${API_URL}/conversations`, {
            headers: { 'x-api-key': API_KEY, 'Authorization': `Bearer ${TOKEN}` }
        });
        const result = await response.json();
        if (response.ok) renderConversations(result.data.conversations || []);
    } catch (err) { console.error(err); }
}

// --- 4. ACTIONS ---

window.openConversation = async function(convId, title) {
    if (!convId || convId === 'undefined') return;
    activeConversationId = convId;

    // LOGIQUE MOBILE : Cacher la liste ET la barre WhatsApp, montrer le chat
    if (window.innerWidth < 768) {
        document.getElementById('sidebar-mid').classList.add('hidden');
        document.getElementById('mobile-nav').classList.add('hidden'); // Cacher Nav WhatsApp
        document.getElementById('chat-window').classList.remove('hidden');
        document.getElementById('chat-window').classList.add('flex');
    }
    
    document.getElementById('chat-contact-name').textContent = title;
    document.getElementById('contact-initials').textContent = String(title).substring(0, 2).toUpperCase();

    const container = document.getElementById('messages-container');
    container.innerHTML = '<div class="text-center text-[10px] text-slate-400 mt-10 italic">Chargement...</div>';

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
        }
    } catch (err) { console.error(err); }
}

async function sendMessage() {
    const input = document.getElementById('message-input');
    const content = input.value.trim();
    if (!content || !activeConversationId) return;

    try {
        await fetch(`${API_URL}/conversations/${activeConversationId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY, 'Authorization': `Bearer ${TOKEN}` },
            body: JSON.stringify({ content })
        });
        input.value = "";
        silentRefreshMessages();
        loadConversations();
    } catch (err) { console.error(err); }
}

// ... (Garder les fonctions silentRefreshMessages, triggerSearch, createNewConversation, renderConversations, displaySearchResults, renderMessages et updateOnlineStatus du code précédent) ...

async function silentRefreshMessages() {
    if (!activeConversationId) return;
    try {
        const response = await fetch(`${API_URL}/conversations/${activeConversationId}/messages`, {
            headers: { 'x-api-key': API_KEY, 'Authorization': `Bearer ${TOKEN}` }
        });
        const result = await response.json();
        const msgs = Array.isArray(result) ? result : (result.data || []);
        renderMessages(msgs);
    } catch (err) { console.error(err); }
}

async function triggerSearch(query) {
    try {
        const response = await fetch(`${API_URL}/users`, {
            headers: { 'x-api-key': API_KEY, 'Authorization': `Bearer ${TOKEN}` }
        });
        const result = await response.json();
        const users = result.data?.users || result.data || [];
        const found = users.filter(u => 
            (u.fullName || "").toLowerCase().includes(query.toLowerCase()) && 
            String(u.id || u._id) !== String(currentUser.id || currentUser._id)
        );
        displaySearchResults(found);
    } catch (err) { console.error(err); }
}

window.createNewConversation = async function(userId, userName) {
    try {
        const response = await fetch(`${API_URL}/conversations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY, 'Authorization': `Bearer ${TOKEN}` },
            body: JSON.stringify({ type: "private", participantIds: [userId] })
        });
        const result = await response.json();
        if (response.ok) {
            const id = result.data.id || result.data._id;
            document.getElementById('search-input').value = "";
            await loadConversations();
            openConversation(id, userName);
        }
    } catch (err) { console.error(err); }
}

function renderConversations(conversations) {
    const container = document.getElementById('conversations-list');
    if (!container) return;
    container.innerHTML = ""; 
    if (conversations.length === 0) {
        container.innerHTML = '<p class="p-8 text-center text-[10px] text-slate-300">Aucune conversation récente</p>';
        return;
    }
    conversations.forEach(conv => {
        let nameToShow = "Discussion";
        if (conv.name && conv.name !== "null") {
            nameToShow = conv.name;
        } else if (conv.participants && currentUser) {
            const myId = String(currentUser.id || currentUser._id);
            const other = conv.participants.find(p => String(p.userId || p.id || p._id) !== myId);
            if (other) nameToShow = other.user?.fullName || other.fullName || "Utilisateur";
        }
        const id = conv.id || conv._id;
        const safeTitle = String(nameToShow).replace(/'/g, "\\'");
        const isSelected = activeConversationId === id;
        container.insertAdjacentHTML('beforeend', `
            <div onclick="openConversation('${id}', '${safeTitle}')" 
                 class="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 cursor-pointer transition border-b border-slate-50 ${isSelected ? 'bg-slate-50 border-l-4 border-blue-600' : ''}">
                <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">${String(nameToShow).substring(0, 2)}</div>
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-baseline mb-0.5">
                        <h4 class="font-bold text-slate-800 text-[12px] truncate">${nameToShow}</h4>
                        <span class="text-[9px] text-slate-300">14:20</span>
                    </div>
                    <p class="text-[11px] text-slate-400 truncate font-medium">${conv.lastMessage?.content || "Démarrer une discussion"}</p>
                </div>
            </div>`);
    });
}

function displaySearchResults(users) {
    const container = document.getElementById('conversations-list');
    container.innerHTML = '<div class="p-3 text-[9px] font-bold text-blue-600 uppercase bg-blue-50/30">Résultats :</div>';
    users.forEach(u => {
        const name = u.fullName || "Utilisateur";
        const safeName = String(name).replace(/'/g, "\\'");
        container.insertAdjacentHTML('beforeend', `
            <div onclick="window.createNewConversation('${u.id || u._id}', '${safeName}')" class="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50">
                <div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase">${String(name).substring(0,2)}</div>
                <h4 class="font-bold text-slate-800 text-[11px]">${name}</h4>
            </div>`);
    });
}

function renderMessages(messages) {
    const container = document.getElementById('messages-container');
    if (!container) return;
    const msgsArray = Array.isArray(messages) ? messages : (messages.messages || []);
    container.innerHTML = "";
    msgsArray.forEach(msg => {
        const isMe = String(msg.senderId) === String(currentUser.id || currentUser._id);
        container.insertAdjacentHTML('beforeend', `
            <div class="flex ${isMe ? 'justify-end' : 'justify-start'} w-full mb-2">
                <div class="${isMe ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none' : 'bg-slate-100 text-slate-700 rounded-2xl rounded-tl-none'} p-3 shadow-sm">
                    <p class="text-[12px] leading-relaxed">${msg.content}</p>
                </div>
            </div>`);
    });
    container.scrollTop = container.scrollHeight;
}

function updateOnlineStatus(isOnline) {
    const dot = document.getElementById('online-dot');
    const statusText = document.getElementById('chat-contact-status');
    if (!dot || !statusText) return;
    dot.className = `w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-slate-300'}`;
    statusText.textContent = isOnline ? "En ligne" : "Hors-ligne";
}