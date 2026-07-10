const darkModeBtn = document.getElementById('darkModeBtn');

// Bouton dark mode de la page d'accueil (index.html)
// Utilise la même clé localStorage que toutes les autres pages ("theme")
// et applique la classe "dark" sur <html> (cohérent avec Tailwind darkMode: 'class')
if (darkModeBtn) {
    darkModeBtn.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        // Compatibilité avec le fichier css/dark.css (sélecteurs body.dark)
        document.body.classList.toggle('dark', isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
}

// Appliquer l'état sauvegardé au chargement (theme.js gère <html>,
// mais css/dark.css de la page d'accueil cible aussi body.dark)
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    document.body.classList.add('dark');
}
