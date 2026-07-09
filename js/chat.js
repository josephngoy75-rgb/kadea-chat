// --- 1. CONFIGURATION ---
const API_URL = "https://kadea-chat-api.onrender.com";
const API_KEY = "wksp_4dfecb20c70ac622983ae8356d95ff8a";
const TOKEN = localStorage.getItem('token');

let currentUser = null;
let activeConversationId = null;
let isSearching = false; 

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
    };

    document.getElementById('delete-conv-btn').onclick = openDeleteModal;
    document.getElementById('confirm-delete-btn').onclick = deleteCurrentConversation;
    document.getElementById('gear-btn').onclick = () => window.location.href = 'profile.html';

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
            document.getElementById('user-fullname-display').textContent = currentUser.fullName;
        }
    } catch (err) { console.error(err); }
}

async function loadConversations() {
    if (isSearching) return;
    try {
        const response = await fetch(`${API_URL}/conversations`, {
            headers: { 'x-api-key': API_KEY, 'Authorization': `Bearer ${TOKEN}` }
        });
        const result = await response.json();
        if (response.ok) renderConversations(result.data.conversations || []);
    } catch (err) { console.error(err); }
}

// --- 4. ACTIONS ---

window.createNewConversation = async function(userId, userName) {
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
        }
    } catch (err) { console.error(err); }
}

window.openConversation = async function(convId, title) {
    if (!convId || convId === 'undefined') return;
    activeConversationId = convId;

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
        await silentRefreshMessages();
        loadConversations();
    } catch (err) { console.error(err); }
}

// --- 5. RENDU ---

function renderConversations(conversations) {
    const container = document.getElementById('conversations-list');
    if (!container || isSearching) return;
    container.innerHTML = conversations.length === 0 ? '<p class="p-8 text-center text-[10px] text-slate-300 italic">Aucune conversation.</p>' : ""; 

    conversations.forEach(conv => {
        const myId = String(currentUser.id || currentUser._id);
        const other = conv.participants?.find(p => String(p.userId || p.id || p._id) !== myId);
        let name = other ? (other.user?.fullName || other.fullName) : "Utilisateur";
        const id = conv.id || conv._id;
        const lastMsg = conv.lastMessage?.content || "Discussion vide";
        const date = conv.lastMessage ? new Date(conv.lastMessage.createdAt) : new Date(conv.createdAt);
        const timeStr = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        container.insertAdjacentHTML('beforeend', `
            <div onclick="window.openConversation('${id}', '${name.replace(/'/g, "\\'")}')" 
                 class="conv-item flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 cursor-pointer transition border-b border-slate-50 ${activeConversationId === id ? 'bg-slate-50 border-l-4 border-blue-600' : ''}">
                <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">${String(name).substring(0, 2)}</div>
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-baseline mb-0.5">
                        <h4 class="font-bold text-slate-800 text-[12px] truncate">${name}</h4>
                        <span class="text-[9px] text-slate-400">${timeStr}</span>
                    </div>
                    <p class="text-[11px] text-slate-400 truncate">${lastMsg}</p>
                </div>
            </div>`);
    });
}

function renderMessages(messages) {
    const container = document.getElementById('messages-container');
    if (!container) return;
    const msgsArray = Array.isArray(messages) ? messages : (messages.messages || []);
    container.innerHTML = '<div class="flex justify-center mb-6"><span class="bg-slate-50 text-slate-400 text-[9px] font-bold px-3 py-1 rounded-full uppercase">Aujourd\'hui</span></div>';
    msgsArray.forEach(msg => {
        const isMe = String(msg.senderId) === String(currentUser.id || currentUser._id);
        const time = new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        container.insertAdjacentHTML('beforeend', `<div class="flex ${isMe ? 'justify-end' : 'justify-start'} w-full mb-2"><div class="max-w-[75%]"><div class="${isMe ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none' : 'bg-slate-100 text-slate-700 rounded-2xl rounded-tl-none'} p-2.5 shadow-sm"><p class="text-[12px] leading-relaxed font-medium">${msg.content}</p></div><span class="text-[8px] text-slate-300 mt-1 block ${isMe ? 'text-right' : ''}">${time}</span></div></div>`);
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
            container.innerHTML = '<div class="p-3 text-[9px] font-bold text-blue-600 uppercase bg-blue-50/30">Résultats :</div>';
            found.forEach(u => {
                const safeName = String(u.fullName).replace(/'/g, "\\'");
                container.insertAdjacentHTML('beforeend', `<div onclick="window.createNewConversation('${u.id || u._id}', '${safeName}')" class="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50"><div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase">${String(u.fullName).substring(0,2)}</div><h4 class="font-bold text-slate-800 text-[11px]">${u.fullName}</h4></div>`);
            });
        }
    } catch (err) { console.error(err); }
}

window.openDeleteModal = () => document.getElementById('delete-modal').classList.remove('hidden');
window.closeDeleteModal = () => document.getElementById('delete-modal').classList.add('hidden');

async function deleteCurrentConversation() {
    if (!activeConversationId) return;
    try {
        await fetch(`${API_URL}/conversations/${activeConversationId}`, { method: 'DELETE', headers: { 'x-api-key': API_KEY, 'Authorization': `Bearer ${TOKEN}` } });
        window.closeDeleteModal(); activeConversationId = null; loadConversations();
        document.getElementById('messages-container').innerHTML = ""; 
        document.getElementById('chat-contact-name').textContent = "Sélectionnez un contact";
        if (window.innerWidth < 768) document.getElementById('back-to-list').click();
    } catch (err) { console.error(err); }
}

function updateOnlineStatus(isOnline) {
    const dot = document.getElementById('online-dot');
    if (dot) dot.className = `w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-slate-300'}`;
}

async function silentRefreshMessages() {
    if (!activeConversationId || isSearching) return;
    try {
        const response = await fetch(`${API_URL}/conversations/${activeConversationId}/messages`, { headers: { 'x-api-key': API_KEY, 'Authorization': `Bearer ${TOKEN}` } });
        const result = await response.json();
        renderMessages(Array.isArray(result.data) ? result.data : (result.data?.messages || []));
    } catch (err) { console.error(err); }
}