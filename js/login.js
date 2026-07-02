// On récupère les éléments
const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('https://kadea-chat-api.onrender.com/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': 'wksp_4dfecb20c70ac622983ae8356d95ff8a'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {

            // 1. On enregistre le token reçu
            localStorage.setItem('token', data.token);
            
            // 2. On enregistre les infos de l'utilisateur (nom, email, etc.)
            localStorage.setItem('user', JSON.stringify(data.user));

            // 3. Redirection vers la page principale (le chat)
            window.location.href = 'chat.html'; 
        } else {
            showError("Email ou mot de passe incorrect.");
        }

    } catch (error) {
        showError("Erreur de connexion au serveur.");
    }
});

function showError(message) {
    errorMessage.textContent = "⚠️ " + message;
    errorMessage.classList.remove('hidden');
}