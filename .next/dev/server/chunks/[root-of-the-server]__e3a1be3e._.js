module.exports = [
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/@supabase/supabase-js [external] (@supabase/supabase-js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("@supabase/supabase-js", () => require("@supabase/supabase-js"));

module.exports = mod;
}),
"[project]/pages/api/createShare.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$supabase$2f$supabase$2d$js__$5b$external$5d$__$2840$supabase$2f$supabase$2d$js$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/@supabase/supabase-js [external] (@supabase/supabase-js, cjs)");
;
const SUPABASE_URL = ("TURBOPACK compile-time value", "https://pooeznhpatagoojswxgr.supabase.co");
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            error: 'Method not allowed'
        });
    }
    if (!SERVICE_ROLE_KEY || !SUPABASE_URL) {
        return res.status(500).json({
            error: 'Server not configured'
        });
    }
    const { path, expires = 60 * 60 } = req.body || {};
    if (!path || typeof path !== 'string') {
        return res.status(400).json({
            error: 'Missing path'
        });
    }
    // Expect Authorization: Bearer <access_token>
    const authHeader = req.headers.authorization || '';
    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({
            error: 'Missing user token'
        });
    }
    // Use service role client to validate token and create signed URL
    const svc = (0, __TURBOPACK__imported__module__$5b$externals$5d2f40$supabase$2f$supabase$2d$js__$5b$external$5d$__$2840$supabase$2f$supabase$2d$js$2c$__cjs$29$__["createClient"])(SUPABASE_URL, SERVICE_ROLE_KEY);
    try {
        // Validate token and get user
        const { data: userData, error: userErr } = await svc.auth.getUser(token);
        if (userErr || !userData?.user) {
            return res.status(401).json({
                error: 'Invalid token'
            });
        }
        const user = userData.user;
        // Ensure the path belongs to this user (basic check)
        if (!path.startsWith(`${user.id}/`)) {
            return res.status(403).json({
                error: 'Not authorized to share this file'
            });
        }
        const { data, error } = await svc.storage.from('uploads').createSignedUrl(path, expires);
        if (error || !data?.signedURL) {
            return res.status(500).json({
                error: 'Could not create signed URL'
            });
        }
        return res.status(200).json({
            url: data.signedURL
        });
    } catch (err) {
        return res.status(500).json({
            error: err && err.message || String(err)
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__e3a1be3e._.js.map