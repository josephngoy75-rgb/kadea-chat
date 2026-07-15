
(function () {
    // 1. Appliquer immédiatement le thème pour éviter le fond blanc
    const theme = localStorage.getItem('theme') || 'light';
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }

    // 2. Désactiver temporairement les transitions CSS au chargement initial
    // pour éviter l'animation de changement de couleur (ex: transition-colors)
    const style = document.createElement('style');
    style.textContent = '*, *::before, *::after { transition: none !important; }';
    document.head.appendChild(style);

    // Réactiver les transitions une fois la page peinte
    window.addEventListener('load', () => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                document.head.removeChild(style);
            });
        });
    });

    // 3. Appliquer immédiatement les données de profil stockées (Avatar, Nom)
    // dès que le DOM est prêt (avant même que fetch(/auth/me) ne réponde)
    document.addEventListener('DOMContentLoaded', () => {
        // Appliquer l'avatar local
        const storedAvatar = localStorage.getItem('myAvatarUrl');
        if (storedAvatar) {
            const avatarIds = ['user-avatar-img', 'avatar-preview-img'];
            avatarIds.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.src = storedAvatar;
            });
        }

        // Appliquer le nom local
        let storedName = localStorage.getItem('myFullName');
        if (!storedName) {
            try {
                const overrides = JSON.parse(localStorage.getItem('profileOverrides') || '{}');
                storedName = overrides.name;
            } catch (e) {}
        }

        if (storedName) {
            const nameDisplays = ['user-fullname-display', 'profile-name'];
            nameDisplays.forEach(id => {
                const el = document.getElementById(id);
                if (el && (el.textContent.trim() === 'Chargement...' || el.textContent.trim() === '')) {
                    el.textContent = storedName;
                }
            });
        }
    });

})();