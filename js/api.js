// 1. CONFIGURATION DE BASE
const BASE_URL = "https://kadea-chat-api.onrender.com";

// REMPLACE PAR TA CLÉ RÉCUPÉRÉE LORS DE LA CRÉATION DU WORKSPACE
const API_KEY = "wksp_4dfecb20c70ac622983ae8356d95ff8a"; 

/**
 * Fonction universelle pour envoyer des requêtes à l'API Kadea
 * @param {string} endpoint - Le chemin (ex: /auth/me)
 * @param {object} options - Les options (method, body, headers)
 */
export async function apiRequest(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    
    // On récupère le token de l'utilisateur s'il est connecté
    const token = localStorage.getItem('token');

    // Préparation des headers (les étiquettes du colis)
    const headers = {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY, // Obligatoire pour Kadea
        // Si on a un token, on l'ajoute pour prouver qui on est
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
    };

    try {
        // Envoi de la requête
        const response = await fetch(url, { ...options, headers });
        
        // On transforme la réponse en JSON
        const data = await response.json();

        // Si le serveur renvoie une erreur (400, 401, 404, 500...)
        if (!response.ok) {
            throw new Error(data.message || "Une erreur est survenue");
        }

        // Si tout est OK, on renvoie le statut et les données
        return {
            status: true,
            body: data
        };

    } catch (error) {
        console.error("Erreur API Request:", error.message);
        // On renvoie un objet d'erreur pour que le code appelant puisse le gérer
        return {
            status: false,
            body: { message: error.message }
        };
    }
}