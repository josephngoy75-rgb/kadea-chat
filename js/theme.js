/**
 * KADEA CHAT — Thème global et Anti-FOUC
 * Inclus dans le <head> de TOUTES les pages.
 */
(function () {
    // 1. Appliquer immédiatement le thème (avant parsing du body) pour éviter le flash blanc/noir
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.classList.toggle('dark', theme === 'dark');

    // 2. Bloquer toutes les transitions au chargement initial (évite l'animation de couleur)
    const noTransition = document.createElement('style');
    noTransition.id = '_no-transition';
    noTransition.textContent = '*, *::before, *::after { transition: none !important; animation-duration: 0ms !important; }';
    document.head.appendChild(noTransition);

    // Réactiver les transitions après deux frames (page entièrement peinte)
    window.addEventListener('load', function () {
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                const el = document.getElementById('_no-transition');
                if (el) el.remove();
            });
        });
    });

    // 3. Injecter avatar + nom INSTANTANÉMENT depuis le cache local
    //    On cache les images avec opacity:0 pour éviter d'afficher l'avatar par défaut,
    //    puis on les révèle après avoir appliqué le bon src.
    document.addEventListener('DOMContentLoaded', function () {
        const lastUserId = localStorage.getItem('lastUserId');
        if (!lastUserId) return;

        // --- AVATAR ---
        const storedAvatar = localStorage.getItem('myAvatarUrl_' + lastUserId);
        const avatarIds = ['user-avatar-img', 'avatar-preview-img'];
        avatarIds.forEach(function (id) {
            const el = document.getElementById(id);
            if (!el) return;
            if (storedAvatar) {
                // Masquer le temps de basculer le src, puis révéler
                el.style.opacity = '0';
                el.src = storedAvatar;
                el.onload = function () { el.style.opacity = '1'; };
                el.onerror = function () { el.style.opacity = '1'; }; // Révèle même en cas d'erreur
            } else {
                // Pas de cache : ne rien mettre (évite l'avatar générique "pravatar")
                el.style.opacity = '0';
            }
        });

        // --- NOM ---
        const storedName = localStorage.getItem('myFullName_' + lastUserId);
        if (storedName) {
            var nameIds = ['user-fullname-display', 'profile-name'];
            nameIds.forEach(function (id) {
                var el = document.getElementById(id);
                if (el) el.textContent = storedName;
            });
        }
    });
})();