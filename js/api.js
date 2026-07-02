// fetch("https://kadea-chat-api.onrender.com/workspaces", {
//   method: "GET",
//   headers: {
//     "x-api-key": "wksp_4dfecb20c70ac622983ae8356d95ff8a"
//   }
// })
// .then(res => res.json())
// .then(console.log);

const BASE_URL = "https://kadea-chat-api.onrender.com";
const API_KEY = "wksp_4dfecb20c70ac622983ae8356d95ff8a";

function fetchPost(endpoint, body) {
    return fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": API_KEY
        },
        body: JSON.stringify(body)
    })
    .then(res => {
        console.log("Status :", res.status);
        return res.json();
    })
    .then(data => {
        console.log("Réponse API :", data);
        return data;
    })
    .catch(error => {
        console.error("Erreur :", error);
    });
}
fetchPost()