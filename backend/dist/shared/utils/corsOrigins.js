"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allowedCorsOrigins = allowedCorsOrigins;
exports.isAllowedCorsOrigin = isAllowedCorsOrigin;
const defaultOrigins = [
    'https://kampungcetak.com',
    'https://www.kampungcetak.com',
    'https://admin.kampungcetak.com',
    'https://email.kampungcetak.com',
    'https://shop-co-production.up.railway.app',
];
function normalizeOrigin(value) {
    try {
        const url = new URL(value.trim());
        if (!['http:', 'https:'].includes(url.protocol))
            return null;
        if (url.username || url.password || url.pathname !== '/' || url.search || url.hash)
            return null;
        return url.origin;
    }
    catch (_a) {
        return null;
    }
}
function allowedCorsOrigins(env = process.env) {
    const configured = [env.FRONTEND_URL, env.ADMIN_APP_URL, ...(env.CORS_ALLOWED_ORIGINS || '').split(',')];
    const origins = new Set(defaultOrigins);
    for (const value of configured) {
        if (!(value === null || value === void 0 ? void 0 : value.trim()))
            continue;
        const origin = normalizeOrigin(value.replace(/\/$/, ''));
        if (origin)
            origins.add(origin);
    }
    if (env.NODE_ENV !== 'production') {
        for (const host of ['localhost', '127.0.0.1']) {
            for (const port of [3000, 3001, 8000])
                origins.add(`http://${host}:${port}`);
        }
    }
    return origins;
}
function isAllowedCorsOrigin(origin, allowed) {
    if (!origin)
        return true;
    const normalized = normalizeOrigin(origin);
    return normalized !== null && allowed.has(normalized);
}
