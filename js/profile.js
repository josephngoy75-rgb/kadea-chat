// js/profile.js

const API_URL = "https://kadea-chat-api.onrender.com";
const API_KEY = "wksp_4dfecb20c70ac622983ae8356d95ff8a";
const TOKEN = localStorage.getItem('token');

document.addEventListener('DOMContentLoaded', async () => {
    if (!TOKEN) { window.location.href = 'login.html'; return; }

    await loadFullProfile();

    // Gestion du bouton Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = (e) => {
            e.preventDefault();
            if(confirm("Voulez-vous vraiment vous déconnecter ?")) {
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

            // Remplissage des champs de ta maquette
            document.getElementById('profile-name').textContent = user.fullName;
            document.getElementById('profile-email').textContent = user.email;
            
            // Détails du compte
            document.getElementById('detail-username').textContent = user.fullName.toLowerCase().replace(' ', '_');
            
            // Formatage de la date de création
            const memberSince = new Date(user.createdAt).toLocaleDateString('fr-FR', {
                month: 'long', year: 'numeric'
            });
            const dateBadge = document.querySelector('.bg-blue-50');
            if (dateBadge) dateBadge.innerHTML = `<i class="fa-solid fa-circle-check mr-1"></i> Member since ${memberSince}`;
        }
    } catch (err) {
        console.error("Erreur chargement profil", err);
    }
}