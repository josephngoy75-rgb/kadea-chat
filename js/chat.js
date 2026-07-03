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

    // Recherche INSTANTANÉE
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query.length > 0) {
                triggerSearch(query);
            } else {
                loadConversations();
            }
        });
    }

    // Envoi Message
    document.getElementById('send-btn').addEventListener('click', sendMessage);
    document.getElementById('message-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Navigation Profil
    document.getElementById('gear-btn').onclick = () => window.location.href = 'profile.html';
});

// --- 3. FONCTIONS API ---

async function loadUserProfile() {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: { 'x-api-key': API_KEY, 'Authorization': `Bearer ${TOKEN}` }
        });
        const result = await response.json();
        if (response.ok && result.data?.user) {
            currentUser = result.data.user;
            document.getElementById('user-fullname-display').textContent = currentUser.fullName;
            if(currentUser.avatarUrl) document.getElementById('user-avatar-img').src = currentUser.avatarUrl;
        }
    } catch (err) { console.error("Profil error:", err); }
}

async function loadConversations() {
    try {
        const response = await fetch(`${API_URL}/conversations`, {
            headers: { 'x-api-key': API_KEY, 'Authorization': `Bearer ${TOKEN}` }
        });
        const result = await response.json();
        if (response.ok) {
            renderConversations(result.data.conversations || []);
        }
    } catch (err) { console.error("Convs error:", err); }
}

async function triggerSearch(query) {
    try {
        const response = await fetch(`${API_URL}/users`, {
            headers: { 'x-api-key': API_KEY, 'Authorization': `Bearer ${TOKEN}` }
        });
        const result = await response.json();
        if (response.ok && result.data?.users) {
            const found = result.data.users.filter(u => 
                u.fullName.toLowerCase().includes(query.toLowerCase()) && u.id !== currentUser.id
            );
            displaySearchResults(found);
        }
    } catch (err) { console.error("Search error:", err); }
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
            document.getElementById('search-input').value = "";
            await loadConversations();
            openConversation(result.data._id, userName);
        }
    } catch (err) { console.error("Creation error:", err); }
}

window.openConversation = async function(convId, title) {
    activeConversationId = convId;
    
    const nameElem = document.getElementById('chat-contact-name');
    if (nameElem) nameElem.textContent = title;
    
    document.getElementById('chat-contact-status').textContent = "Online";
    document.getElementById('online-dot').className = "w-1.5 h-1.5 bg-green-500 rounded-full";
    document.getElementById('contact-initials').textContent = title.substring(0, 2).toUpperCase();

    const container = document.getElementById('messages-container');
    container.innerHTML = '<div class="text-center text-[10px] text-slate-400 mt-10 italic">Chargement des messages...</div>';

    try {
        const response = await fetch(`${API_URL}/conversations/${convId}/messages`, {
            headers: { 'x-api-key': API_KEY, 'Authorization': `Bearer ${TOKEN}` }
        });
        const result = await response.json();
        if (response.ok) renderMessages(result.data);
    } catch (err) { console.error("Msg error:", err); }
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
        const title = document.getElementById('chat-contact-name').textContent;
        openConversation(activeConversationId, title);
        loadConversations();
    } catch (err) { console.error("Send error:", err); }
}

// --- 5. RENDU ---

function renderConversations(conversations) {
    const container = document.getElementById('conversations-list');
    container.innerHTML = ""; 

    if (conversations.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-40 text-center px-6">
                <i class="fa-regular fa-comment-dots text-slate-200 text-2xl mb-2"></i>
                <p class="text-[11px] font-semibold text-slate-400">Aucune conversation récente</p>
                <p class="text-[10px] text-slate-300 mt-1">Cherchez un utilisateur pour commencer.</p>
            </div>`;
        return;
    }

    conversations.forEach(conv => {
        let title = conv.title || "Discussion";
        if (title === "Discussion") {
            const other = conv.participants?.find(p => p.id !== currentUser.id);
            if (other) title = other.fullName;
        }
        const last = conv.lastMessage?.content || "Nouveau chat";
        const isSelected = activeConversationId === conv._id;

        const html = `
            <div onclick="openConversation('${conv._id}', '${title}')" 
                 class="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 cursor-pointer transition border-b border-slate-50 ${isSelected ? 'bg-slate-50 border-l-4 border-blue-600' : ''}">
                <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[10px]">
                    ${title.substring(0, 2).toUpperCase()}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-baseline mb-0.5">
                        <h4 class="font-bold text-slate-800 text-[12px] truncate">${title}</h4>
                        <span class="text-[9px] text-slate-400">14:20</span>
                    </div>
                    <p class="text-[11px] text-slate-400 truncate font-medium">${last}</p>
                </div>
            </div>`;
        container.insertAdjacentHTML('beforeend', html);
    });
}

function displaySearchResults(users) {
    const container = document.getElementById('conversations-list');
    container.innerHTML = '<div class="p-3 text-[9px] font-bold text-blue-600 uppercase bg-blue-50/30 tracking-widest">Résultats de recherche :</div>';
    users.forEach(u => {
        container.insertAdjacentHTML('beforeend', `
            <div onclick="createNewConversation('${u.id}', '${u.fullName}')" class="flex items-center gap-3 px-5 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50">
                <div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                    ${u.fullName.substring(0,2).toUpperCase()}
                </div>
                <h4 class="font-bold text-slate-800 text-[11px]">${u.fullName}</h4>
            </div>`);
    });
}

function renderMessages(messages) {
    const container = document.getElementById('messages-container');
    container.innerHTML = '<div class="flex justify-center my-4"><span class="bg-slate-50 text-slate-400 text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Aujourd\'hui</span></div>';
    
    messages.forEach(msg => {
        const isMe = msg.senderId === currentUser.id;
        container.insertAdjacentHTML('beforeend', `
            <div class="max-w-[75%] ${isMe ? 'ml-auto' : ''} space-y-1">
                <div class="${isMe ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none' : 'bg-slate-100 text-slate-700 rounded-2xl rounded-tl-none'} p-3 shadow-sm">
                    <p class="text-[12px] leading-relaxed">${msg.content}</p>
                </div>
                <span class="text-[9px] text-slate-400 block ${isMe ? 'text-right' : ''} px-1">14:05</span>
            </div>`);
    });
    container.scrollTop = container.scrollHeight;
}