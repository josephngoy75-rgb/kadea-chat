/**
 * KADEA CHAT — Système de traduction (i18n)
 * Chargé tôt dans le <head> (comme theme.js) pour appliquer la langue
 * avant que la page ne soit visible, et éviter un flash dans la mauvaise langue.
 *
 * Usage HTML : <span data-i18n="clé">Texte par défaut</span>
 *              <input data-i18n-placeholder="clé">
 *              <div data-i18n-html="clé"></div>  (autorise le HTML, ex: <br>)
 *
 * Usage JS :   window.KadeaI18n.t('clé')
 *              window.KadeaI18n.setLanguage('en' | 'fr')
 */
(function () {
    const TRANSLATIONS = {
        fr: {
            // Commun / partagé entre plusieurs pages
            "common.cancel": "Annuler",
            "common.delete": "Supprimer",
            "common.archive": "Archiver",
            "common.unarchive": "Désarchiver",
            "common.edit": "Modifier",
            "common.copy": "Copier",
            "common.save": "Enregistrer",
            "common.loading": "Chargement...",
            "common.confirm": "Confirmer",

            // Navigation (barres latérales / nav mobile, partagées sur plusieurs pages)
            "nav.chats": "Chats",
            "nav.calls": "Appels",
            "nav.members": "Membres",
            "nav.community": "Communauté",
            "nav.archives": "Archives",
            "nav.profile": "Profil",
            "nav.login": "Connexion",
            "nav.signup": "S'inscrire",

            // Page d'accueil (index.html)
            "home.title": "Un espace<br>d'échange entre<br>apprenants.",
            "home.subtitle": "Kadea Chat vous permet de collaborer avec vos pairs, partager vos connaissances et progresser ensemble au sein de votre communauté numérique.",
            "lang.english": "Anglais",
            "lang.french": "Français",

            // Connexion (login.html)
            "login.title": "Bon retour",
            "login.subtitle": "Entrez vos identifiants pour vous connecter à Kadea Chat",
            "login.emailLabel": "Adresse email",
            "login.passwordLabel": "Mot de passe",
            "login.forgot": "Oublié ?",
            "login.remember": "Rester connecté",
            "login.button": "Se connecter",
            "login.loadingLabel": "Connexion...",
            "login.noAccount": "Pas encore de compte ?",
            "login.createAccount": "Créer un compte",
            "login.success": "Connexion réussie ! Ravie de vous revoir.",
            "login.serverError": "Le serveur n'a pas renvoyé de données valides.",
            "login.defaultError": "Identifiants incorrects.",

            // Inscription (register.html)
            "register.title": "Créer un compte",
            "register.subtitle": "Rejoignez la communauté et commencez à discuter.",
            "register.fullNameLabel": "Nom complet",
            "register.emailLabel": "Adresse email",
            "register.passwordLabel": "Mot de passe",
            "register.confirmPasswordLabel": "Confirmer le mot de passe",
            "register.button": "Créer le compte",
            "register.loadingLabel": "Traitement...",
            "register.termsPrefix": "En vous inscrivant, vous acceptez nos",
            "register.terms": "Conditions",
            "register.and": "et notre",
            "register.privacy": "Politique de confidentialité",
            "register.haveAccount": "Vous avez déjà un compte ?",
            "register.login": "Se connecter",
            "register.fillAllFields": "Veuillez remplir tous les champs.",
            "register.invalidEmail": "Adresse email invalide (exemple attendu : nom@domaine.com).",
            "register.passwordMismatch": "Les mots de passe ne correspondent pas.",
            "register.success": "Compte créé avec succès ! Redirection...",
            "register.defaultError": "Erreur lors de l'inscription.",

            // Règles de mot de passe (partagées : register / reset / profil)
            "pwd.rule8": "Le mot de passe doit contenir au moins 8 caractères.",
            "pwd.ruleUpper": "Le mot de passe doit contenir au moins une majuscule.",
            "pwd.ruleDigit": "Le mot de passe doit contenir au moins un chiffre.",
            "pwd.ruleSpecial": "Le mot de passe doit contenir au moins un caractère spécial.",

            // Mot de passe oublié (forgot-password.html)
            "forgot.title": "Mot de passe oublié",
            "forgot.subtitle": "Entrez votre adresse email, nous vous enverrons un code de vérification.",
            "forgot.emailLabel": "Adresse email",
            "forgot.button": "Envoyer le code",
            "forgot.loadingLabel": "Envoi en cours...",
            "forgot.backToLogin": "Retour à la connexion",
            "forgot.emailRequired": "Veuillez entrer votre adresse email.",
            "forgot.invalidEmail": "Adresse email invalide.",
            "forgot.codeGenerated": "Code généré : {code} (aucun email requis). Redirection...",
            "forgot.codeSentDefault": "Code envoyé ! Vérifiez votre boîte mail (et vos spams). Redirection...",
            "forgot.sendError": "Impossible d'envoyer le code.",

            // Réinitialisation (reset-password.html)
            "reset.title": "Nouveau mot de passe",
            "reset.subtitleBefore": "Entrez le code reçu à",
            "reset.subtitleAfter": "et choisissez un nouveau mot de passe.",
            "reset.defaultEmail": "votre adresse email",
            "reset.codeLabel": "Code de vérification",
            "reset.newPasswordLabel": "Nouveau mot de passe",
            "reset.confirmPasswordLabel": "Confirmer le mot de passe",
            "reset.button": "Réinitialiser le mot de passe",
            "reset.loadingLabel": "Validation...",
            "reset.backToLogin": "Retour à la connexion",
            "reset.fillAllFields": "Veuillez remplir tous les champs.",
            "reset.codeInvalid": "Le code doit contenir 6 chiffres.",
            "reset.passwordMismatch": "Les mots de passe ne correspondent pas.",
            "reset.success": "Mot de passe réinitialisé avec succès ! Redirection...",
            "reset.defaultError": "Code invalide ou expiré.",

            // Messagerie (chat.html)
            "chat.searchPlaceholder": "Rechercher des conversations...",
            "chat.selectContact": "Sélectionnez un contact",
            "chat.offline": "Hors ligne",
            "chat.emptyTitle": "Bienvenue dans votre messagerie",
            "chat.emptySubtitle": "Sélectionnez une conversation ou recherchez un utilisateur pour commencer à discuter.",
            "chat.messagePlaceholder": "Écrivez un message...",
            "chat.deleteConvTitle": "Supprimer la discussion ?",
            "chat.deleteMsgTitle": "Supprimer le message ?",
            "chat.deleteConfirmText": "Cette action est définitive.",
            "chat.noConversations": "Aucune conversation.",
            "chat.emptyConversation": "Discussion vide",
            "chat.today": "Aujourd'hui",
            "chat.searchResults": "Résultats :",
            "chat.profileLoadError": "Impossible de charger votre profil.",
            "chat.networkError": "Erreur réseau : profil indisponible.",
            "chat.convLoadError": "Impossible de charger les conversations.",
            "chat.convNetworkError": "Erreur réseau : conversations indisponibles.",
            "chat.convCreateError": "Impossible de créer la conversation.",
            "chat.convCreateNetworkError": "Erreur réseau : conversation impossible à créer.",
            "chat.convNotFound": "Cette conversation est introuvable.",
            "chat.convUnavailable": "Erreur réseau : conversation indisponible.",
            "chat.sendMessageError": "Le message n'a pas pu être envoyé.",
            "chat.convArchived": "Conversation archivée.",
            "chat.convUnarchived": "Conversation désarchivée.",
            "chat.deleteConvError": "Impossible de supprimer la conversation.",
            "chat.editMessageError": "Impossible de modifier ce message.",
            "chat.deleteMessageError": "Impossible de supprimer ce message.",

            // Communauté (users.html)
            "users.title": "Communauté",
            "users.searchPlaceholder": "Rechercher un apprenant...",
            "users.recentActive": "Récemment actifs",
            "users.allMembers": "Tous les membres",
            "users.online": "En ligne",
            "users.offline": "Hors-ligne",
            "users.membersLoadError": "Impossible de charger la liste des membres.",
            "users.membersNetworkError": "Erreur réseau : membres indisponibles.",
            "users.startChatError": "Impossible de démarrer la conversation.",
            "users.startChatNetworkError": "Erreur réseau : impossible de démarrer la conversation.",

            // Archives (archiver.html)
            "archiver.title": "Conversations archivées",
            "archiver.noConversations": "Aucune conversation archivée.",
            "archiver.loadError": "Impossible de charger les archives.",
            "archiver.networkError": "Erreur réseau : archives indisponibles.",

            // Profil (profile.html)
            "profile.accountDetails": "Account Details",
            "profile.username": "Username",
            "profile.phone": "Phone",
            "profile.notProvided": "Non renseigné",
            "profile.language": "Language",
            "profile.privacySecurity": "Privacy & Security",
            "profile.twoFactor": "2FA",
            "profile.enabled": "Enabled",
            "profile.activeSessions": "Active Sessions",
            "profile.alertPreferences": "Alert Preferences",
            "profile.editProfileBtn": "Edit Profile",
            "profile.changePasswordBtn": "Change Password",
            "profile.deleteAccountBtn": "Supprimer mon compte",
            "profile.logoutBtn": "Logout",
            "profile.memberSince": "Member since",
            "profile.footer": "Kadea Chat v1.0.0 — Encryption Active",
            "profile.editTitle": "Modifier le profil",
            "profile.editFullName": "Nom complet",
            "profile.editEmail": "Adresse email",
            "profile.editEmailNote": "Affiché sur cet appareil uniquement (l'email de connexion reste inchangé).",
            "profile.editPhone": "Téléphone",
            "profile.themeToggleDark": "Mode sombre",
            "profile.themeToggleLight": "Mode clair",
            "profile.languageMenuLabel": "Langue",
            "profile.changePasswordTitle": "Changer le mot de passe",
            "profile.oldPassword": "Mot de passe actuel",
            "profile.newPassword": "Nouveau mot de passe",
            "profile.confirmNewPassword": "Confirmer le nouveau mot de passe",
            "profile.validate": "Valider",
            "profile.logoutTitle": "Se déconnecter ?",
            "profile.logoutText": "Vous devrez vous reconnecter pour accéder à vos messages.",
            "profile.logoutConfirm": "Se déconnecter",
            "profile.deleteAccountTitle": "Supprimer définitivement votre compte ?",
            "profile.deleteAccountText": "Cette action est irréversible : votre profil, vos conversations et vos messages seront définitivement effacés. Tapez SUPPRIMER pour confirmer.",
            "profile.deleteAccountConfirm": "Supprimer définitivement",
            "profile.confirmWord": "SUPPRIMER",
            "profile.profileLoadError": "Impossible de charger votre profil.",
            "profile.networkError": "Erreur réseau : profil indisponible.",
            "profile.fullNameRequired": "Le nom complet est requis.",
            "profile.invalidEmail": "Adresse email invalide.",
            "profile.updateError": "Impossible de mettre à jour le profil.",
            "profile.updateSuccess": "Profil mis à jour.",
            "profile.fillAllFields": "Veuillez remplir tous les champs.",
            "profile.passwordMismatch": "Les mots de passe ne correspondent pas.",
            "profile.passwordChanged": "Mot de passe modifié avec succès.",
            "profile.wrongOldPassword": "Mot de passe actuel incorrect.",
            "profile.avatarUpdated": "Photo de profil mise à jour.",
            "profile.avatarError": "Impossible de charger cette image.",
            "profile.typeDeleteToConfirm": "Saisissez SUPPRIMER pour confirmer.",
            "profile.deleteAccountError": "Impossible de supprimer le compte."
        },

        en: {
            "common.cancel": "Cancel",
            "common.delete": "Delete",
            "common.archive": "Archive",
            "common.unarchive": "Unarchive",
            "common.edit": "Edit",
            "common.copy": "Copy",
            "common.save": "Save",
            "common.loading": "Loading...",
            "common.confirm": "Confirm",

            "nav.chats": "Chats",
            "nav.calls": "Calls",
            "nav.members": "Members",
            "nav.community": "Community",
            "nav.archives": "Archives",
            "nav.profile": "Profile",
            "nav.login": "Login",
            "nav.signup": "Sign Up",

            "home.title": "A space for<br>exchanges<br>between learners.",
            "home.subtitle": "Kadea Chat allows you to collaborate with your peers, share your knowledge and grow together within your digital community.",
            "lang.english": "English",
            "lang.french": "French",

            "login.title": "Welcome back",
            "login.subtitle": "Please enter your details to sign in to Kadea Chat",
            "login.emailLabel": "Email Address",
            "login.passwordLabel": "Password",
            "login.forgot": "Forgot?",
            "login.remember": "Keep me signed in",
            "login.button": "Login",
            "login.loadingLabel": "Signing in...",
            "login.noAccount": "Don't have an account?",
            "login.createAccount": "Create Account",
            "login.success": "Login successful! Welcome back.",
            "login.serverError": "The server did not return valid data.",
            "login.defaultError": "Incorrect credentials.",

            "register.title": "Create Account",
            "register.subtitle": "Join the community and start chatting.",
            "register.fullNameLabel": "Full Name",
            "register.emailLabel": "Email Address",
            "register.passwordLabel": "Password",
            "register.confirmPasswordLabel": "Confirm Password",
            "register.button": "Create Account",
            "register.loadingLabel": "Processing...",
            "register.termsPrefix": "By signing up, you agree to our",
            "register.terms": "Terms",
            "register.and": "and",
            "register.privacy": "Privacy Policy",
            "register.haveAccount": "Already have an account?",
            "register.login": "Log in",
            "register.fillAllFields": "Please fill in all fields.",
            "register.invalidEmail": "Invalid email address (expected format: name@domain.com).",
            "register.passwordMismatch": "Passwords do not match.",
            "register.success": "Account created successfully! Redirecting...",
            "register.defaultError": "Error during registration.",

            "pwd.rule8": "Password must contain at least 8 characters.",
            "pwd.ruleUpper": "Password must contain at least one uppercase letter.",
            "pwd.ruleDigit": "Password must contain at least one digit.",
            "pwd.ruleSpecial": "Password must contain at least one special character.",

            "forgot.title": "Forgot password",
            "forgot.subtitle": "Enter your email address, we'll send you a verification code.",
            "forgot.emailLabel": "Email Address",
            "forgot.button": "Send code",
            "forgot.loadingLabel": "Sending...",
            "forgot.backToLogin": "Back to login",
            "forgot.emailRequired": "Please enter your email address.",
            "forgot.invalidEmail": "Invalid email address.",
            "forgot.codeGenerated": "Code generated: {code} (no email needed). Redirecting...",
            "forgot.codeSentDefault": "Code sent! Check your inbox (and spam folder). Redirecting...",
            "forgot.sendError": "Unable to send the code.",

            "reset.title": "New password",
            "reset.subtitleBefore": "Enter the code sent to",
            "reset.subtitleAfter": "and choose a new password.",
            "reset.defaultEmail": "your email address",
            "reset.codeLabel": "Verification code",
            "reset.newPasswordLabel": "New password",
            "reset.confirmPasswordLabel": "Confirm password",
            "reset.button": "Reset password",
            "reset.loadingLabel": "Validating...",
            "reset.backToLogin": "Back to login",
            "reset.fillAllFields": "Please fill in all fields.",
            "reset.codeInvalid": "The code must contain 6 digits.",
            "reset.passwordMismatch": "Passwords do not match.",
            "reset.success": "Password reset successfully! Redirecting...",
            "reset.defaultError": "Invalid or expired code.",

            "chat.searchPlaceholder": "Search conversations...",
            "chat.selectContact": "Select a contact",
            "chat.offline": "Offline",
            "chat.emptyTitle": "Welcome to your messenger",
            "chat.emptySubtitle": "Select a conversation or search for a user to start chatting.",
            "chat.messagePlaceholder": "Type a message...",
            "chat.deleteConvTitle": "Delete this conversation?",
            "chat.deleteMsgTitle": "Delete this message?",
            "chat.deleteConfirmText": "This action is permanent.",
            "chat.noConversations": "No conversations.",
            "chat.emptyConversation": "Empty conversation",
            "chat.today": "Today",
            "chat.searchResults": "Results:",
            "chat.profileLoadError": "Unable to load your profile.",
            "chat.networkError": "Network error: profile unavailable.",
            "chat.convLoadError": "Unable to load conversations.",
            "chat.convNetworkError": "Network error: conversations unavailable.",
            "chat.convCreateError": "Unable to create the conversation.",
            "chat.convCreateNetworkError": "Network error: cannot create conversation.",
            "chat.convNotFound": "This conversation could not be found.",
            "chat.convUnavailable": "Network error: conversation unavailable.",
            "chat.sendMessageError": "The message could not be sent.",
            "chat.convArchived": "Conversation archived.",
            "chat.convUnarchived": "Conversation unarchived.",
            "chat.deleteConvError": "Unable to delete the conversation.",
            "chat.editMessageError": "Unable to edit this message.",
            "chat.deleteMessageError": "Unable to delete this message.",

            "users.title": "Community",
            "users.searchPlaceholder": "Search for a learner...",
            "users.recentActive": "Recently active",
            "users.allMembers": "All members",
            "users.online": "Online",
            "users.offline": "Offline",
            "users.membersLoadError": "Unable to load the members list.",
            "users.membersNetworkError": "Network error: members unavailable.",
            "users.startChatError": "Unable to start the conversation.",
            "users.startChatNetworkError": "Network error: unable to start conversation.",

            "archiver.title": "Archived conversations",
            "archiver.noConversations": "No archived conversations.",
            "archiver.loadError": "Unable to load archives.",
            "archiver.networkError": "Network error: archives unavailable.",

            "profile.accountDetails": "Account Details",
            "profile.username": "Username",
            "profile.phone": "Phone",
            "profile.notProvided": "Not provided",
            "profile.language": "Language",
            "profile.privacySecurity": "Privacy & Security",
            "profile.twoFactor": "2FA",
            "profile.enabled": "Enabled",
            "profile.activeSessions": "Active Sessions",
            "profile.alertPreferences": "Alert Preferences",
            "profile.editProfileBtn": "Edit Profile",
            "profile.changePasswordBtn": "Change Password",
            "profile.deleteAccountBtn": "Delete my account",
            "profile.logoutBtn": "Logout",
            "profile.memberSince": "Member since",
            "profile.footer": "Kadea Chat v1.0.0 — Encryption Active",
            "profile.editTitle": "Edit profile",
            "profile.editFullName": "Full name",
            "profile.editEmail": "Email address",
            "profile.editEmailNote": "Shown on this device only (your login email stays unchanged).",
            "profile.editPhone": "Phone",
            "profile.themeToggleDark": "Dark mode",
            "profile.themeToggleLight": "Light mode",
            "profile.languageMenuLabel": "Language",
            "profile.changePasswordTitle": "Change password",
            "profile.oldPassword": "Current password",
            "profile.newPassword": "New password",
            "profile.confirmNewPassword": "Confirm new password",
            "profile.validate": "Validate",
            "profile.logoutTitle": "Log out?",
            "profile.logoutText": "You'll need to sign in again to access your messages.",
            "profile.logoutConfirm": "Log out",
            "profile.deleteAccountTitle": "Permanently delete your account?",
            "profile.deleteAccountText": "This action is irreversible: your profile, conversations and messages will be permanently erased. Type DELETE to confirm.",
            "profile.deleteAccountConfirm": "Permanently delete",
            "profile.confirmWord": "DELETE",
            "profile.profileLoadError": "Unable to load your profile.",
            "profile.networkError": "Network error: profile unavailable.",
            "profile.fullNameRequired": "Full name is required.",
            "profile.invalidEmail": "Invalid email address.",
            "profile.updateError": "Unable to update the profile.",
            "profile.updateSuccess": "Profile updated.",
            "profile.fillAllFields": "Please fill in all fields.",
            "profile.passwordMismatch": "Passwords do not match.",
            "profile.passwordChanged": "Password changed successfully.",
            "profile.wrongOldPassword": "Current password is incorrect.",
            "profile.avatarUpdated": "Profile photo updated.",
            "profile.avatarError": "Unable to load this image.",
            "profile.typeDeleteToConfirm": "Type DELETE to confirm.",
            "profile.deleteAccountError": "Unable to delete the account."
        }
    };

    function getLanguage() {
        return localStorage.getItem('lang') || 'fr';
    }

    function t(key, vars) {
        const lang = getLanguage();
        let text = (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || TRANSLATIONS.fr[key] || key;
        if (vars) {
            Object.keys(vars).forEach(k => {
                text = text.replace(`{${k}}`, vars[k]);
            });
        }
        return text;
    }

    function applyTranslations() {
        const lang = getLanguage();
        document.documentElement.lang = lang;

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = t(key);
        });

        document.querySelectorAll('[data-i18n-html]').forEach(el => {
            const key = el.getAttribute('data-i18n-html');
            el.innerHTML = t(key);
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = t(key);
        });
    }

    function setLanguage(lang) {
        localStorage.setItem('lang', lang);
        // Recharge la page : garantit que tout le contenu (y compris les listes
        // générées dynamiquement par chat.js/users.js/archiver.js) est bien
        // régénéré dans la nouvelle langue, sans logique de re-rendu séparée.
        window.location.reload();
    }

    window.KadeaI18n = { t, getLanguage, setLanguage, applyTranslations };

    document.addEventListener('DOMContentLoaded', () => {
        applyTranslations();
        const select = document.getElementById('language-select');
        if (select) {
            select.value = getLanguage();
            select.addEventListener('change', (e) => setLanguage(e.target.value));
        }
    });
})();
