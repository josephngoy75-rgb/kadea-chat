/**
 * KADEA CHAT — Garde de route (auth-guard.js)
 * Inclus en premier dans le <head> de toutes les pages protégées
 * (chat.html, users.html, archiver.html, profile.html).
 *
 * Si aucun token n'est trouvé dans localStorage, redirige vers index.html
 * AVANT que la page ne soit affichée (pas de flash de contenu non autorisé).
 */
(function () {
    const TOKEN = localStorage.getItem('token');
    if (!TOKEN) {
        // Redirection immédiate, avant même le rendu du body
        window.location.replace('index.html');
    }
})();
