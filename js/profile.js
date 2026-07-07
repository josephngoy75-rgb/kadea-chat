// --- CONFIGURATION ---
const API_URL = "https://kadea-chat-api.onrender.com";
const API_KEY = "wksp_4dfecb20c70ac622983ae8356d95ff8a";
const TOKEN = localStorage.getItem('token');

document.addEventListener('DOMContentLoaded', async () => {
    if (!TOKEN) { window.location.href = 'login.html'; return; }

    await loadFullProfile();

    // Gestion du Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = (e) => {
            e.preventDefault();
            if(confirm("Se déconnecter ?")) {
                localStorage.clear();
                window.location.href = 'index.html';
            }
        };
    }
});

async function loadFullProfile() {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: { 'x-api-key': API_KEY, 'Authorization': `Bearer ${TOKEN}` }
        });
        const result = await response.json();

        if (response.ok && result.data?.user) {
            const user = result.data.user;

            // Remplissage dynamique
            document.getElementById('profile-name').textContent = user.fullName;
            document.getElementById('profile-email').textContent = user.email;
            document.getElementById('detail-username').textContent = user.fullName.toLowerCase().replace(/\s/g, '_');
            
            if(user.avatarUrl) document.getElementById('user-avatar-img').src = user.avatarUrl;

            // Date d'inscription
            const date = new Date(user.createdAt);
            const formattedDate = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
            document.getElementById('member-since').innerHTML = `<i class="fa-solid fa-circle-check mr-1"></i> Member since ${formattedDate}`;
        }
    } catch (err) { console.error("Erreur profil:", err); }
}