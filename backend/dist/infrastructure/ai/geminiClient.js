"use strict";
/**
 * Coded by Harith
 * Kampungcetak ®
 * Thin wrapper around the Google Gemini REST API used by the AI engine:
 *  - text embedding (gemini-embedding-001, 768 dims)
 *  - chat generation (gemini-2.0-flash) with JSON-safe output
 *  - file text extraction (PDF via pdf-parse, images via Gemini vision)
 * Mirrors the openaiClient.ts API so aiProvider.ts can switch between them.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiConfigured = aiConfigured;
exports.getGenModel = getGenModel;
exports.getEmbeddingModel = getEmbeddingModel;
exports.embedTexts = embedTexts;
exports.embedText = embedText;
exports.generateJson = generateJson;
exports.generateText = generateText;
exports.extractTextFromBuffer = extractTextFromBuffer;
// pdf-parse ships a CJS build whose bundled exports trip up TS's call
// signature resolution, so require() it and cast.
const pdfParse = require('pdf-parse');
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
function getKey() {
    const key = process.env.GEMINI_API_KEY;
    if (!key)
        throw new Error('GEMINI_API_KEY is not configured');
    return key;
}
function aiConfigured() {
    return Boolean(process.env.GEMINI_API_KEY);
}
function getGenModel() {
    return process.env.GEMINI_GEN_MODEL || 'gemini-2.0-flash';
}
function getEmbeddingModel() {
    return process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';
}
function geminiFetch(path, body) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const res = yield fetch(`${API_BASE}${path}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': getKey(),
            },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            let detail = '';
            try {
                const err = yield res.json();
                detail = ((_a = err === null || err === void 0 ? void 0 : err.error) === null || _a === void 0 ? void 0 : _a.message) || JSON.stringify(err);
            }
            catch (_b) {
                detail = yield res.text().catch(() => '');
            }
            throw new Error(`Gemini API ${res.status}: ${detail || res.statusText}`);
        }
        return res.json();
    });
}
/** Batches embedding requests (max 100 texts per request) to stay well within rate limits. */
function embedTexts(texts) {
    return __awaiter(this, void 0, void 0, function* () {
        const model = getEmbeddingModel();
        const out = [];
        for (let i = 0; i < texts.length; i += 100) {
            const batch = texts.slice(i, i + 100);
            const data = yield geminiFetch(`/models/${model}:batchEmbedContents`, {
                requests: batch.map((text) => ({
                    model: `models/${model}`,
                    content: { parts: [{ text }] },
                })),
            });
            out.push(...(data.embeddings || []).map((e) => e.values || []));
        }
        return out;
    });
}
function embedText(text) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const model = getEmbeddingModel();
        const data = yield geminiFetch(`/models/${model}:embedContent`, {
            model: `models/${model}`,
            content: { parts: [{ text }] },
        });
        return ((_a = data === null || data === void 0 ? void 0 : data.embedding) === null || _a === void 0 ? void 0 : _a.values) || [];
    });
}
function stripCodeFences(raw) {
    return raw.replace(/```json/gi, '').replace(/```/g, '').trim();
}
function generateContent(system, user, opts, jsonMode) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        const generationConfig = {
            temperature: (_a = opts.temperature) !== null && _a !== void 0 ? _a : 0.3,
            maxOutputTokens: (_b = opts.maxTokens) !== null && _b !== void 0 ? _b : 2048,
        };
        if (jsonMode)
            generationConfig.responseMimeType = 'application/json';
        const data = yield geminiFetch(`/models/${getGenModel()}:generateContent`, {
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: 'user', parts: [{ text: user }] }],
            generationConfig,
        });
        const parts = (((_e = (_d = (_c = data === null || data === void 0 ? void 0 : data.candidates) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.content) === null || _e === void 0 ? void 0 : _e.parts) || []);
        return parts.map((p) => p.text || '').join('');
    });
}
/** Asks the model to reply with valid JSON and parses it. Throws on bad JSON. */
function generateJson(system_1, user_1) {
    return __awaiter(this, arguments, void 0, function* (system, user, opts = {}) {
        const content = yield generateContent(system, user, opts, true);
        if (!content)
            throw new Error('Empty LLM response');
        return JSON.parse(stripCodeFences(content));
    });
}
/** Plain text generation (no JSON parsing). */
function generateText(system_1, user_1) {
    return __awaiter(this, arguments, void 0, function* (system, user, opts = {}) {
        return generateContent(system, user, opts, false);
    });
}
/** Extracts plain text from an uploaded file's buffer. */
function extractTextFromBuffer(buffer_1, mimetype_1) {
    return __awaiter(this, arguments, void 0, function* (buffer, mimetype, filename = 'file') {
        var _a, _b, _c;
        const mime = (mimetype || '').toLowerCase();
        const name = (filename || '').toLowerCase();
        if (mime === 'application/pdf' || name.endsWith('.pdf')) {
            try {
                const parsed = yield pdfParse(buffer);
                return (parsed.text || '').slice(0, 30000);
            }
            catch (err) {
                console.error('[ai] pdf-parse failed:', err.message);
                return '';
            }
        }
        if (mime.startsWith('image/') || /\.(png|jpe?g|webp|tiff|gif|bmp)$/.test(name)) {
            const base64 = buffer.toString('base64');
            const prompt = 'Ekstrak SEMUA teks dan butiran yang kelihatan dalam imej ini, termasuk nama, nombor, saiz, kuantiti, tarikh dan sebarang teks lain. Sila senaraikan dalam format teks biasa.';
            try {
                const data = yield geminiFetch(`/models/${getGenModel()}:generateContent`, {
                    contents: [
                        {
                            role: 'user',
                            parts: [
                                { text: prompt },
                                { inlineData: { mimeType: mime, data: base64 } },
                            ],
                        },
                    ],
                    generationConfig: { maxOutputTokens: 1024 },
                });
                const parts = (((_c = (_b = (_a = data === null || data === void 0 ? void 0 : data.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.parts) || []);
                return parts.map((p) => p.text || '').join('');
            }
            catch (err) {
                console.error('[ai] vision extraction failed:', err.message);
                return '';
            }
        }
        // Unsupported type — return nothing, verification will rely on filename only.
        return '';
    });
}
