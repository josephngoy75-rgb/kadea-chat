/**
 * PROJET KADEA CHAT - PAGE COMMUNAUTÉ
 * Mentor : NovaWeb Studio
 */

const API_URL = "https://kadea-chat-api.onrender.com";
const API_KEY = "wksp_4dfecb20c70ac622983ae8356d95ff8a";
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

async function fetchCurrentUser() {
    try {
        const res = await fetch(`${API_URL}/auth/me`, {
            headers: { 'x-api-key': API_KEY, 'Authorization': `Bearer ${TOKEN}` }
        });
        const result = await res.json();
        if (res.ok) currentUser = result.data.user;
    } catch (err) { console.error(err); }
}

async function fetchAllUsers() {
    try {
        const response = await fetch(`${API_URL}/users`, {
            headers: { 'x-api-key': API_KEY, 'Authorization': `Bearer ${TOKEN}` }
        });
        const result = await response.json();
        
        if (response.ok) {
            allUsers = result.data.users || result.data;
            // On enlève Joseph de la liste
            allUsers = allUsers.filter(u => String(u.id || u._id) !== String(currentUser.id));
            
            renderRecentActive(allUsers.slice(0, 10)); // 10 premiers en haut
            renderAlphabeticalList(allUsers); // Tout le monde en bas
        }
    } catch (err) { console.error(err); }
}

// SECTION HORIZONTALE (STYLE MESSENGER)
function renderRecentActive(users) {
    const container = document.getElementById('recent-users');
    if (!container) return;
    container.innerHTML = "";

    users.forEach(u => {
        // Point vert si en ligne, sinon gris
        const statusColor = u.isOnline ? 'bg-green-500' : 'bg-slate-300';

        container.insertAdjacentHTML('beforeend', `
            <div onclick="startChat('${u.id || u._id}', '${u.fullName.replace(/'/g, "\\'")}')" 
                 class="flex flex-col items-center gap-2 cursor-pointer flex-shrink-0 transition-transform active:scale-90">
                <div class="relative">
                    <div class="w-14 h-14 rounded-full bg-blue-50 border-2 border-white shadow-sm flex items-center justify-center text-blue-600 font-bold text-sm uppercase">
                        ${(u.fullName || "??").substring(0, 2)}
                    </div>
                    <span class="absolute bottom-0.5 right-0.5 w-4 h-4 ${statusColor} border-2 border-white rounded-full"></span>
                </div>
                <span class="text-[10px] font-semibold text-slate-600 w-16 truncate text-center">${u.fullName.split(' ')[0]}</span>
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
                <div class="bg-slate-50/50 px-5 py-2 text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">${currentLetter}</div>
            `);
        }

        container.insertAdjacentHTML('beforeend', `
            <div onclick="startChat('${u.id || u._id}', '${u.fullName.replace(/'/g, "\\'")}')" 
                 class="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 cursor-pointer transition border-b border-slate-50">
                <div class="relative">
                    <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                        ${(u.fullName || "??").substring(0, 2)}
                    </div>
                    <span class="absolute bottom-0 right-0 w-2.5 h-2.5 ${statusColor} border-2 border-white rounded-full"></span>
                </div>
                <div class="flex-1">
                    <h4 class="font-bold text-slate-800 text-sm">${u.fullName}</h4>
                    <p class="text-[10px] ${u.isOnline ? 'text-green-500 font-bold' : 'text-slate-400'}">${u.isOnline ? 'En ligne' : 'Hors-ligne'}</p>
                </div>
                <i class="fa-solid fa-chevron-right text-[10px] text-slate-200"></i>
            </div>
        `);
    });
}

// CRÉATION ET REDIRECTION
window.startChat = async function(userId, userName) {
    try {
        const response = await fetch(`${API_URL}/conversations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY, 'Authorization': `Bearer ${TOKEN}` },
            body: JSON.stringify({ type: "private", participantIds: [userId] })
        });
        const result = await response.json();
        
        if (response.ok) {
            // TRANSMISSION DES INFOS À LA PAGE CHAT
            const convId = result.data.id || result.data._id;
            localStorage.setItem('autoOpenConvId', convId);
            localStorage.setItem('autoOpenConvName', userName);
            
            window.location.href = `chat.html`; 
        }
    } catch (err) { console.error(err); }
}