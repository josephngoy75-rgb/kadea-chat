# 💬 Kadea Chat

**Prototype frontend d'une plateforme de messagerie pour apprenants**, développé pour **NovaWeb Studio** (agence) dans le cadre d'une commande du client **Kadea**.

> Avant d'investir dans le développement complet d'une plateforme de messagerie, Kadea souhaitait valider l'expérience utilisateur et les fonctionnalités principales via un prototype frontend fonctionnel, branché sur une API REST déjà existante.

---

## 📑 Sommaire

- [Présentation du projet](#-présentation-du-projet)
- [Notre façon de réfléchir le projet](#-notre-façon-de-réfléchir-le-projet)
- [Architecture & choix techniques](#-architecture--choix-techniques)
- [Fonctionnalités](#-fonctionnalités)
- [Difficultés rencontrées & résolutions](#-difficultés-rencontrées--résolutions)
- [Technologies utilisées](#-technologies-utilisées)
- [Structure du projet](#-structure-du-projet)
- [Installation](#-installation)
- [Démonstration](#-démonstration)
- [Pistes d'évolution](#-pistes-dévolution)
- [Auteur](#-auteur)

---

## 🧭 Présentation du projet

**Kadea Chat** est une application de messagerie en temps quasi-réel, pensée pour des apprenants souhaitant échanger, collaborer et partager leurs connaissances au sein d'une communauté numérique.

Le projet est un **prototype frontend** : toute la logique métier (authentification, gestion des conversations, sécurité, etc.) est développée côté client, en **JavaScript Vanilla**, et consomme une **API REST** fournie et hébergée séparément (`https://kadea-chat-api.onrender.com`). Aucune bibliothèque JavaScript (React, Vue, Angular, jQuery...) n'a été utilisée — un choix imposé par le cahier des charges, mais assumé comme un vrai exercice de compréhension du fonctionnement natif du navigateur.

### Ce que l'application permet de faire
- Créer un compte, se connecter, récupérer un mot de passe oublié
- Consulter la liste de ses conversations, en démarrer de nouvelles
- Envoyer, modifier, supprimer et copier des messages
- Rechercher des utilisateurs et des conversations
- Archiver des conversations sans les supprimer définitivement
- Personnaliser son profil (nom, téléphone, photo), changer de mot de passe, supprimer son compte
- Basculer entre mode clair/sombre et entre français/anglais, avec persistance sur tout l'appareil

---

## 🧠 Notre façon de réfléchir le projet

Le développement n'a pas suivi un cahier des charges figé exécuté ligne par ligne : chaque étape a été déclenchée par un besoin concret ou un problème découvert en testant l'étape précédente — une démarche volontairement itérative, proche de ce qui se passe réellement en entreprise.

L'ordre de raisonnement suivi, du début à la fin du projet :

1. **Auditer avant de construire** — avant d'ajouter des fonctionnalités, vérifier ce qui existe déjà (failles de sécurité, gestion d'erreurs manquante) plutôt que d'empiler du code sur une base fragile.
2. **Enrichir les fonctionnalités cœur** — actions sur les messages (modifier/supprimer/copier), pensées avec la même interaction sur desktop (clic droit) et mobile (appui long), pour ne pas maintenir deux systèmes différents.
3. **Soigner les retours utilisateur** — remplacer les popups natives du navigateur (`alert()`, `confirm()`) par un système de notifications interne, cohérent avec l'identité visuelle de l'application.
4. **Organiser la navigation** — réorganiser l'interface en pensant à l'espace disponible sur mobile (menu "3 points" pour les actions secondaires), plutôt que d'entasser des icônes.
5. **Fluidifier le parcours utilisateur** — corriger le problème du "double clic" pour ouvrir une conversation, ajouter un écran d'accueil plutôt qu'un vide visuel.
6. **Renforcer l'authentification** — validation d'email, règles de mot de passe, parcours complet de récupération.
7. **Diagnostiquer méthodiquement** — face à un bug qui ne venait pas de notre code (panne du service d'envoi d'email de l'API), suivre une démarche d'investigation (comparaison avec d'autres routes, observation réseau) plutôt que de deviner.
8. **Industrialiser l'architecture** — centraliser tous les appels réseau dans un unique point d'accès (`api.js`), une fois le pattern répétitif devenu visible dans plusieurs fichiers.
9. **Internationaliser et personnaliser** — système de langue et de thème appliqués de façon cohérente sur l'ensemble des pages, avec correction d'un bug de fuite de données entre comptes sur un même navigateur.
10. **Documenter et livrer** — commits explicites, README complet, préparation à la soutenance.

Ce déroulement suit une logique simple : **stabiliser → enrichir → simplifier l'expérience → sécuriser → déboguer → industrialiser → documenter.**

---

## 🏗️ Architecture & choix techniques

### Pourquoi aucun framework
Le cahier des charges imposait du JavaScript Vanilla, mais ce choix a été assumé au-delà de la contrainte : sans "boîte noire" d'un framework, chaque comportement de l'interface (mise à jour de l'affichage, gestion des événements, état de chargement) est écrit et compris explicitement — un vrai bénéfice pédagogique, au prix d'un peu plus de code à écrire à la main.

### Un fichier JavaScript par page, un squelette commun à tous
Chaque page HTML a son propre fichier JS dédié (`chat.js`, `profile.js`, `users.js`, `archiver.js`...), mais tous suivent la même organisation interne :

```
1. Configuration       → imports, variables d'état
2. Initialisation      → vérification de session, chargement des données, écouteurs d'événements
3. Fonctions API        → lecture/écriture des données serveur
4. Actions              → réactions aux interactions utilisateur
5. Rendu                → transformation des données en HTML affiché
6. Aides (helpers)      → fonctions utilitaires réutilisées dans le fichier
```

Une fois ce squelette compris dans un fichier, il se retrouve à l'identique dans tous les autres.

### `api.js` — le guichet unique vers le serveur
Tous les appels réseau de l'application passent par une unique fonction : `apiRequest(endpoint, options)`. Elle centralise :
- L'ajout automatique de la clé API et du token d'authentification dans les en-têtes de chaque requête
- Le parsing systématique de la réponse en JSON
- Une réponse **toujours prévisible** (`{ status, body }`), sans jamais laisser une erreur réseau brute remonter et casser le programme appelant

**Pourquoi ce choix :** avant cette centralisation, chaque fichier gérait ses propres appels et ses propres erreurs, ce qui dupliquait la logique partout et rendait le débogage plus long (illustré concrètement lors du diagnostic d'un bug d'API, voir plus bas). Ce principe est connu sous le nom de **DRY** (*Don't Repeat Yourself*).

### Où vivent les données : serveur ou navigateur
| Sur le serveur (API) | Dans le navigateur (`localStorage`) |
|---|---|
| Compte, conversations, messages | Session active (token) |
| Toute donnée partagée entre appareils | Thème, langue |
| | Conversations archivées (non gérées par l'API) |
| | Photo de profil de secours, préférences locales |

Chaque préférence locale liée à un utilisateur (photo, nom affiché) est **associée à son identifiant unique** (ex : `myAvatarUrl_<id>`), pour éviter qu'un changement de compte sur le même navigateur n'hérite des données d'un autre utilisateur — un bug réel identifié et corrigé en cours de projet.

### Sécurité pensée comme une règle systématique, pas une fonctionnalité
Toute donnée provenant d'un utilisateur (message, nom, résultat de recherche) est échappée avant affichage (`escapeHtml()`), pour empêcher qu'un contenu malveillant ne s'exécute chez les autres utilisateurs (faille XSS). Cette règle est appliquée uniformément dans tous les fichiers qui affichent du contenu externe.

### Simuler le temps réel
En l'absence de WebSocket (hors périmètre du cahier des charges), l'application redemande automatiquement les nouvelles données au serveur toutes les 4 secondes (`setInterval`). Un compromis assumé, proportionné à un prototype.

### Modules transverses (actifs sur toutes les pages)
- **`theme.js`** : applique le mode sombre/clair **avant l'affichage** de la page (anti flash), en lisant la préférence sauvegardée.
- **`i18n.js`** : dictionnaire de traductions français/anglais. Chaque élément traduisible porte un attribut `data-i18n="clé"` ; changer la langue recharge la page pour garantir la cohérence de tout le contenu, y compris généré dynamiquement.
- **`avatar.js`** : centralise la décision de quelle photo afficher (photo locale la plus récente → photo du serveur → initiales générées en secours), pour que chaque page applique la même logique sans la dupliquer.

---

## ✨ Fonctionnalités

### Authentification
- Inscription avec validation (champs obligatoires, format email, règles de mot de passe : 8 caractères, majuscule, chiffre, caractère spécial)
- Connexion avec gestion des erreurs (identifiants invalides, erreur réseau)
- Mot de passe oublié (envoi d'un code) et réinitialisation
- Changement de mot de passe depuis le profil (avec l'ancien mot de passe)
- Déconnexion et suppression définitive du compte (avec confirmation explicite)

### Messagerie
- Liste des conversations avec dernier message et horodatage
- Recherche de conversations et d'utilisateurs
- Ouverture d'une conversation en un seul clic (création automatique si elle n'existe pas encore, sans doublon)
- Envoi, modification, suppression et copie de messages (clic droit sur desktop, appui long sur mobile)
- Écran d'accueil dédié en l'absence de conversation sélectionnée
- Rafraîchissement automatique des messages et conversations

### Organisation
- Archivage de conversations (géré en local, l'API ne proposant pas cette fonction) et page dédiée aux archives
- Page Communauté listant tous les utilisateurs, avec section "récemment actifs"

### Profil & personnalisation
- Édition du nom, de l'email affiché et du téléphone
- Upload et redimensionnement automatique de la photo de profil
- Mode sombre / clair, persistant sur toutes les pages
- Changement de langue (français/anglais), persistant sur toutes les pages

### Expérience utilisateur
- Notifications internes (toasts) pour chaque succès/échec, remplaçant les popups natives du navigateur
- Gestion de tous les états d'interface : chargement, liste vide, absence de résultat, erreur réseau/serveur

---

## 🐞 Difficultés rencontrées & résolutions

**Ouverture d'une conversation en deux clics.** Cliquer sur un contact créait la conversation mais ne l'ouvrait pas. *Résolution :* vérification de l'existence de la conversation avant création, ouverture automatique dans la foulée.

**Un champ d'édition qui se refermait tout seul.** Modifier un message rouvrait le champ à l'état initial avant la fin de la saisie. *Cause :* le rafraîchissement automatique (toutes les 4 secondes) écrasait le champ en cours d'édition. *Résolution :* mise en pause du rafraîchissement pendant une édition active.

**Photo de profil partagée entre deux comptes.** Sur un même navigateur, changer de compte affichait la photo du compte précédent. *Cause :* clé de stockage local non liée à l'utilisateur. *Résolution :* chaque préférence locale est désormais associée à l'identifiant unique de son propriétaire.

**Un bug qui ne venait pas de notre code.** Le code de réinitialisation de mot de passe n'arrivait jamais par email. *Démarche :* vérification que d'autres routes de l'API fonctionnaient normalement, observation de la requête réseau dans les outils du navigateur, attente jusqu'à obtenir une erreur serveur (500) après 2 minutes. *Conclusion :* panne du service d'envoi d'email de l'API fournie, en dehors du périmètre du frontend.

---

## 🛠️ Technologies utilisées

| Technologie | Rôle |
|---|---|
| **HTML5** | Structure des pages |
| **Tailwind CSS** (CDN) | Mise en forme, sans CSS écrit à la main |
| **JavaScript Vanilla (ES Modules)** | Toute la logique applicative |
| **API REST** (`fetch`) | Authentification, conversations, messages, utilisateurs |
| **LocalStorage** | Session, préférences (thème, langue), archivage, avatar |
| **Font Awesome** | Icônes |

Aucun framework, aucun outil de build (pas de bundler, pas de compilation) — les fichiers sont utilisables directement par un navigateur.

---

## 📁 Structure du projet

```
kadea-chat/
├── index.html                 # Page d'accueil
├── login.html                 # Connexion
├── register.html              # Inscription
├── forgot-password.html       # Demande de réinitialisation
├── reset-password.html        # Réinitialisation du mot de passe
├── chat.html                  # Messagerie
├── users.html                 # Communauté
├── archiver.html              # Conversations archivées
├── profile.html                # Profil & paramètres
└── js/
    ├── api.js                 # Point d'accès centralisé à l'API
    ├── i18n.js                # Système de traduction FR/EN
    ├── theme.js                # Mode sombre/clair (anti-flash)
    ├── avatar.js               # Résolution de la photo de profil
    ├── button-loader.js        # Indicateur de chargement générique
    ├── app.js                  # Logique spécifique à la page d'accueil
    ├── login.js
    ├── register.js
    ├── forgot-password.js
    ├── reset-password.js
    ├── chat.js
    ├── users.js
    ├── archiver.js
    └── profile.js
```

---

## ⚙️ Installation

Le projet ne nécessite aucune étape de build.

1. **Cloner le dépôt**
   ```bash
   git clone <url-du-dépôt>
   cd kadea-chat
   ```

2. **Lancer un serveur local** (nécessaire pour que les modules JavaScript `type="module"` fonctionnent correctement) :
   - Avec l'extension **Live Server** de VS Code : clic droit sur `index.html` → *Open with Live Server*
   - Ou avec Python :
     ```bash
     python3 -m http.server 8080
     ```
   - Ou avec Node.js :
     ```bash
     npx serve .
     ```

3. **Ouvrir l'application** à l'adresse indiquée par le serveur (ex : `http://localhost:8080`).

> ℹ️ La clé API (`x-api-key`) est déjà configurée dans `js/api.js`. Elle correspond à un *workspace* pédagogique isolé, propre à ce projet.

---

## 🌐 Démonstration

Application déployée : **[à compléter avec le lien Netlify / Vercel / GitHub Pages]**

---

## 🔮 Pistes d'évolution

- Remplacer le rafraîchissement périodique par une vraie connexion temps réel (WebSocket)
- Gérer l'archivage des conversations côté serveur si l'API évolue
- Ajouter l'envoi d'images et de fichiers dans les messages
- Ajouter des indicateurs de frappe et des accusés de lecture
- Pagination des messages pour les conversations très longues

---

## 👤 Auteur

**Ngoy Ndala Joseph**
Projet réalisé dans le cadre d'une mise en situation professionnelle — module JavaScript, pour le compte de NovaWeb Studio.