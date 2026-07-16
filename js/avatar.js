// Utilitaires avatar partagés — jamais d'image pravatar par défaut

export const AVATAR_PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

export function getInitialsAvatarUrl(fullName, size = 150) {
    const initials = String(fullName || '?')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(w => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || '?';

    const hue = [...String(fullName || '')].reduce((h, c) => h + c.charCodeAt(0), 0) % 360;
    const bg = `hsl(${hue}, 65%, 55%)`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="100%" height="100%" fill="${bg}"/><text x="50%" y="50%" dy="0.35em" text-anchor="middle" fill="white" font-family="Inter,sans-serif" font-size="${Math.round(size * 0.38)}" font-weight="600">${initials}</text></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function resolveAvatarUrl(userId, apiAvatarUrl, fullName) {
    if (userId) {
        const local = localStorage.getItem(`myAvatarUrl_${userId}`);
        if (local) return local;
    }
    if (apiAvatarUrl) {
        if (userId) localStorage.setItem(`myAvatarUrl_${userId}`, apiAvatarUrl);
        return apiAvatarUrl;
    }
    if (fullName) return getInitialsAvatarUrl(fullName);
    return AVATAR_PLACEHOLDER;
}

export function applyAvatarToElement(el, url) {
    if (!el) return;
    el.src = url || AVATAR_PLACEHOLDER;
}

export function applyAvatarByIds(ids, url) {
    ids.forEach(id => applyAvatarToElement(document.getElementById(id), url));
}                        
