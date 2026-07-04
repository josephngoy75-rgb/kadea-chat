// --- 1. CONFIGURATION ---
const API_URL = "https://kadea-chat-api.onrender.com";
const API_KEY = "wksp_4dfecb20c70ac622983ae8356d95ff8a";
const TOKEN = localStorage.getItem('token');

// Variable pour stocker Joseph
let currentUser = null;

// --- 2. INITIALISATION (Le seul et unique chef d'orchestre) ---

document.addEventListener('DOMContentLoaded', async () => {

    // Gardien de sécurité

    if (!TOKEN) { 
        window.location.href = 'login.html'; 
        return; 
    }

    console.log("🚀 Initialisation du chat...");
    
    // On attend d'abord d'avoir le profil de Joseph (Important pour comparer les noms après)
    await loadUserProfile();
    
    // Ensuite on charge les discussions
    await loadConversations();

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            handleSearch(e.target.value.trim());
        });
    }
});

// --- 3. FONCTIONS API ---

/**
 * Récupère le profil de Joseph
 */
async function loadUserProfile() {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: { 'x-api-key': API_KEY, 'Authorization': `Bearer ${TOKEN}` }
        });
        const result = await response.json();
        console.log(result)

        if (response.ok && result.data && result.data.user) {
            currentUser = result.data.user;
            document.getElementById('user-fullname-display').textContent = currentUser.fullName;
            console.log("✅ Profil Joseph chargé :", currentUser.id);
        } else {
            handleLogout();
        }
    } catch (error) { console.error("Erreur profil:", error); }
}

/**
 * Récupère les vraies conversations
 */
async function loadConversations() {
    try {
        const response = await fetch(`${API_URL}/conversations`, {
            headers: { 'x-api-key': API_KEY, 'Authorization': `Bearer ${TOKEN}` }
        });
        const result = await response.json();
        console.log(result)

        if (response.ok) {
            renderConversations(result.data.conversations || []);
        }
    } catch (error) { console.error("Erreur convs:", error); }
}

// --- 4. FONCTIONS DE RENDU (L'interface) ---

function renderConversations(conversations) {
    const container = document.getElementById('conversations-list');
    if (!container) return;

    container.innerHTML = ""; // On vide Sarah et les autres

    if (conversations.length === 0) {
        container.innerHTML = `
            <div class="p-8 text-center">
                <p class="text-[11px] text-slate-400 font-medium">Aucune conversation récente</p>
            </div>
        `;
        return;
    }

    conversations.forEach(conv => {

        // --- LOGIQUE POUR TROUVER LE NOM DE L'AMI ---

        let chatTitle = "Discussion";

        // Si l'API ne donne pas de nom, on cherche l'autre participant

        if (!conv.name || conv.name === "null") {
            if (conv.participants && currentUser) {

                const other = conv.participants.find(p => p.userId !== currentUser.id);
                if (other && other.user) {
                    chatTitle = other.user.fullName;
                }
            }
        } else {
            chatTitle = conv.name;
        }

        const lastMsg = conv.lastMessage ? conv.lastMessage.content : "Démarrer une discussion";

        const convHTML = `
            <div class="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 cursor-pointer transition border-b border-slate-50">
                <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
                    ${chatTitle.substring(0, 2)}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-baseline mb-0.5">
                        <h4 class="font-bold text-slate-800 text-[12px] truncate">${chatTitle}</h4>
                        <span class="text-[9px] text-slate-300">14:20</span>
                    </div>
                    <p class="text-[11px] text-slate-400 truncate font-medium">${lastMsg}</p>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', convHTML);
    });
}

function handleLogout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

// ==========================================
// ÉTAPE 3 : RECHERCHE ET CRÉATION DE CHAT
// ==========================================

/**
 * Lance la recherche quand on tape dans l'input
 */
async function handleSearch(query) {
    const container = document.getElementById('conversations-list');
    
    // Si la recherche est vide, on recharge les conversations normales
    if (query.length === 0) {
        loadConversations();
        return;
    }

    // On affiche un petit message de chargement
    container.innerHTML = '<p class="p-5 text-center text-xs text-blue-500">Recherche...</p>';

    try {
        const response = await fetch(`${API_URL}/users`, {
            headers: { 'x-api-key': API_KEY, 'Authorization': `Bearer ${TOKEN}` }
        });
        const result = await response.json();

        if (response.ok) {
            // On filtre les utilisateurs (on ignore Joseph lui-même)
            const allUsers = result.data.users || result.data;
            const filtered = allUsers.filter(user => 
                user.fullName.toLowerCase().includes(query.toLowerCase()) && 
                user.id !== currentUser.id
            );

            displaySearchResults(filtered);
        }
    } catch (err) { console.error("Erreur recherche:", err); }
}

/**
 * Affiche les résultats de la recherche dans la sidebar
 */
function displaySearchResults(users) {
    const container = document.getElementById('conversations-list');
    container.innerHTML = '<p class="p-3 text-[10px] font-bold text-blue-600 uppercase bg-blue-50">Résultats :</p>';

    if (users.length === 0) {
        container.innerHTML += '<p class="p-5 text-center text-xs text-slate-400">Aucun utilisateur trouvé.</p>';
        return;
    }

    users.forEach(user => {
        container.insertAdjacentHTML('beforeend', `
            <div onclick="startNewConversation('${user.id}', '${user.fullName}')" 
                 class="flex items-center gap-3 px-5 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50">
                <div class="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                    ${user.fullName.substring(0, 2)}
                </div>
                <div>
                    <h4 class="font-bold text-slate-800 text-[12px]">${user.fullName}</h4>
                    <p class="text-[10px] text-blue-500 font-semibold">Cliquer pour discuter</p>
                </div>
            </div>
        `);
    });
}

/**
 * Crée une nouvelle conversation avec l'élu
 */
window.startNewConversation = async function(userId, userName) {
    try {
        const response = await fetch(`${API_URL}/conversations`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-api-key': API_KEY, 
                'Authorization': `Bearer ${TOKEN}` 
            },
            body: JSON.stringify({
                type: "private",
                participantIds: [userId]
            })
        });

        const result = await response.json();

        if (response.ok) {
            // Succès : on vide la recherche et on recharge les discussions
            document.getElementById('search-input').value = "";
            await loadConversations();
            // Optionnel : On peut même l'ouvrir directement (étape 4)
            // openConversation(result.data.id, userName); 
        }
    } catch (err) { console.error("Erreur création:", err); }
}