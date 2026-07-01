const BASE_URL = "https://kadea-chat-api.onrender.com";

export async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
    };

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
        
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Une erreur est survenue");
        }

        return data; 

    } catch (error) {
        console.error("Erreur dans apiRequest:", error.message);
        
        throw error; 
    }
}