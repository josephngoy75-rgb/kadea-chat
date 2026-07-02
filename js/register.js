// fetch("https://kadea-chat-api.onrender.com/workspaces", {
//   method: "GET",
//   headers: {
//     "x-api-key": "wksp_4dfecb20c70ac622983ae8356d95ff8a"
//   }
// })
// .then(res => res.json())
// .then(console.log);

// On récupère les éléments du DOM
const registerForm = document.getElementById('registerForm');
const errorMessage = document.getElementById('errorMessage');

// On écoute la soumission du formulaire
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // On empêche la page de se recharger

    // 1. RÉCUPÉRATION DES VALEURS
    const fullName = document.getElementById('fullname').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // 2. VALIDATIONS (Cahier des charges point 1)
    errorMessage.classList.add('hidden'); // On cache l'erreur au début
    errorMessage.textContent = "";

    if (!fullName || !email || !password || !confirmPassword) {
        showError("Veuillez remplir tous les champs.");
        return;
    }

    if (password !== confirmPassword) {
        showError("Les mots de passe ne correspondent pas.");
        return;
    }

    if (password.length < 6) {
        showError("Le mot de passe doit faire au moins 6 caractères.");
        return;
    }

    // 3. APPEL API (Cahier des charges point 4)
    try {
        const response = await fetch('https://kadea-chat-api.onrender.com/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            
                'x-api-key': 'wksp_4dfecb20c70ac622983ae8356d95ff8a' 
            },
            body: JSON.stringify({
                fullName: fullName,
                email: email,
                password: password
            })
        });

        const data = await response.json();
    
        if (response.ok) {
            // SUCCÈS
        
            window.location.href = 'login.html';
        } else {
            // ERREUR SERVEUR (Email déjà utilisé, etc.)
            showError(data.message || "L'inscription a échoué.");
        }

    } catch (error) {
        // ERREUR RÉSEAU (Pas d'internet, serveur en panne)
        showError("Impossible de contacter le serveur. Vérifiez votre connexion.");
    }
});

// Petite fonction pour afficher l'erreur proprement
function showError(message) {
    errorMessage.textContent = "⚠️ " + message;
    errorMessage.classList.remove('hidden');
}