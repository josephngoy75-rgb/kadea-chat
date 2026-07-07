// --- CONFIGURATION ---
const API_URL = "https://kadea-chat-api.onrender.com";
const API_KEY = "wksp_4dfecb20c70ac622983ae8356d95ff8a";
const TOKEN = localStorage.getItem('token');

let currentUser = null;
let activeConversationId = null;
let pressTimer;
let unreadMap = {}; 

// --- INITIALISATION ---
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

    // Modal Suppression
    document.getElementById('confirm-delete-btn').onclick = deleteCurrentConversation;

    // Retour Mobile
    document.getElementById('back-to-list').onclick = () => {
        document.getElementById('sidebar-mid').classList.remove('hidden');
        document.getElementById('chat-window').classList.add('hidden');
        document.getElementById('chat-window').classList.remove('flex');
        document.getElementById('mobile-nav').classList.remove('hidden');
        activeConversationId = null;
    };

    // Refresh Auto
    setInterval(() => { 
        if (activeConversationId) silentRefreshMessages(); 
        loadConversations(); 
    }, 4000);
});

// --- API ---

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
        if (response.ok) {
            const conversations = result.data.conversations || [];
            updateUnreadStatus(conversations);
            renderConversations(conversations);
        }
    } catch (err) { console.error(err); }
}

function updateUnreadStatus(conversations) {
    conversations.forEach(conv => {
        const id = conv.id || conv._id;
        if (conv.lastMessage && String(conv.lastMessage.senderId) !== String(currentUser.id) && activeConversationId !== id) {
            unreadMap[id] = 1;
        } else if (activeConversationId === id) {
            unreadMap[id] = 0;
        }
    });
}

// --- RENDU UI ---

function renderConversations(conversations) {
    const container = document.getElementById('conversations-list');
    if (!container) return;
    container.innerHTML = ""; 

    conversations.forEach(conv => {
        const myId = String(currentUser.id || currentUser._id);
        const other = conv.participants?.find(p => String(p.userId || p.id || p._id) !== myId);
        let name = other ? (other.user?.fullName || other.fullName) : "Discussion";
        
        const id = conv.id || conv._id;
        const lastMsg = conv.lastMessage?.content || "Nouveau chat";
        const time = conv.lastMessage ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "";
        const isUnread = unreadMap[id] > 0;

        const html = `
            <div class="conv-item flex items-center gap-3 px-5 py-4 hover:bg-slate-50 cursor-pointer transition border-b border-slate-50 relative no-select"
                 data-id="${id}" data-name="${name}">
                <div class="w-11 h-11 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">${name.substring(0, 2)}</div>
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-baseline mb-0.5">
                        <h4 class="font-bold text-slate-800 text-[12px] truncate ${isUnread ? 'text-blue-600' : ''}">${name}</h4>
                        <span class="text-[9px] ${isUnread ? 'text-blue-600 font-bold' : 'text-slate-400'}">${time}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <p class="text-[11px] ${isUnread ? 'text-slate-900 font-bold' : 'text-slate-400'} truncate flex-1">${lastMsg}</p>
                        ${isUnread ? `<span class="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-2">1</span>` : ''}
                    </div>
                </div>
            </div>`;
        container.insertAdjacentHTML('beforeend', html);
    });
    setupLongPress();
}

function renderMessages(messages) {
    const container = document.getElementById('messages-container');
    container.innerHTML = '<div class="flex justify-center mb-6"><span class="bg-slate-100 text-slate-400 text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Aujourd\'hui</span></div>';
    
    messages.forEach(msg => {
        const isMe = String(msg.senderId) === String(currentUser.id || currentUser._id);
        const time = new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        container.insertAdjacentHTML('beforeend', `
            <div class="flex ${isMe ? 'justify-end' : 'justify-start'} w-full mb-1">
                <div class="max-w-[75%]">
                    <div class="${isMe ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none' : 'bg-slate-100 text-slate-700 rounded-2xl rounded-tl-none'} p-3 shadow-sm">
                        <p class="text-[12px] leading-relaxed">${msg.content}</p>
                    </div>
                    <span class="text-[9px] text-slate-400 mt-1 block ${isMe ? 'text-right' : ''}">${time}</span>
                </div>
            </div>`);
    });
    container.scrollTop = container.scrollHeight;
}

// --- ACTIONS ---

window.openConversation = async function(convId, title) {
    if (!convId || convId === 'undefined') return;
    activeConversationId = convId;
    unreadMap[convId] = 0; 

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

async function deleteCurrentConversation() {
    if (!activeConversationId) return;
    try {
        await fetch(`${API_URL}/conversations/${activeConversationId}`, {
            method: 'DELETE',
            headers: { 'x-api-key': API_KEY, 'Authorization': `Bearer ${TOKEN}` }
        });
        closeDeleteModal();
        if (window.innerWidth < 768) document.getElementById('back-to-list').click();
        else {
            document.getElementById('chat-contact-name').textContent = "Sélectionnez un contact";
            document.getElementById('messages-container').innerHTML = "";
            activeConversationId = null;
        }
        loadConversations();
    } catch (err) { console.error(err); }
}

// --- INTERACTION ---

function setupLongPress() {
    const items = document.querySelectorAll('.conv-item');
    items.forEach(item => {
        item.onmousedown = item.ontouchstart = (e) => {
            pressTimer = setTimeout(() => {
                activeConversationId = item.dataset.id;
                document.getElementById('context-menu-title').textContent = item.dataset.name;
                document.getElementById('mobile-context-menu').classList.remove('hidden');
            }, 700);
        };
        item.onmouseup = item.ontouchend = () => clearTimeout(pressTimer);
        item.onclick = () => {
            if (document.getElementById('mobile-context-menu').classList.contains('hidden')) {
                window.openConversation(item.dataset.id, item.dataset.name);
            }
        };
    });
}

window.closeContextMenu = () => { document.getElementById('mobile-context-menu').classList.add('hidden'); };
window.openDeleteModal = () => { closeContextMenu(); document.getElementById('delete-modal').classList.remove('hidden'); };
window.closeDeleteModal = () => { document.getElementById('delete-modal').classList.add('hidden'); };

function updateOnlineStatus(isOnline) {
    const dot = document.getElementById('online-dot');
    const statusText = document.getElementById('chat-contact-status');
    if (!dot || !statusText) return;
    dot.className = `w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-slate-300'}`;
    statusText.textContent = isOnline ? "En ligne" : "Hors-ligne";
    statusText.className = `text-[9px] font-medium ${isOnline ? 'text-green-500' : 'text-slate-400'}`;
}

async function silentRefreshMessages() {
    if (!activeConversationId) return;
    try {
        const response = await fetch(`${API_URL}/conversations/${activeConversationId}/messages`, {
            headers: { 'x-api-key': API_KEY, 'Authorization': `Bearer ${TOKEN}` }
        });
        const result = await response.json();
        const msgs = Array.isArray(result.data) ? result.data : (result.data?.messages || []);
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
        const found = users.filter(u => (u.fullName || "").toLowerCase().includes(query.toLowerCase()) && String(u.id || u._id) !== String(currentUser.id));
        displaySearchResults(found);
    } catch (err) { console.error(err); }
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

window.createNewConversation = async function(userId, userName) {
    try {
        const response = await fetch(`${API_URL}/conversations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY, 'Authorization': `Bearer ${TOKEN}` },
            body: JSON.stringify({ type: "private", participantIds: [userId] })
        });
        const result = await response.json();
        if (response.ok) {
            document.getElementById('search-input').value = "";
            await loadConversations();
            openConversation(result.data.id || result.data._id, userName);
        }
    } catch (err) { console.error(err); }
}