/**
 * KADEA CHAT — Thème global (mode sombre / clair)
 * Ce fichier doit être inclus dans TOUTES les pages, AVANT le script principal.
 *
 * Il applique immédiatement la classe `dark` sur <html> si le thème sauvegardé
 * est "dark". Cela évite un flash blanc au chargement des pages en mode sombre.
 *
 * Utilise la même clé localStorage que profile.js : "theme".
 */

(function () {
    const theme = localStorage.getItem('theme') || 'light';
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
})();
