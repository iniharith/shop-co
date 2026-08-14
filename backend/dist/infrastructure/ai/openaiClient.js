"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
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
/**
 * Coded by Harith
 * Kampungcetak ®
 * Thin wrapper around the OpenAI SDK used by the AI engine:
 *  - text embedding (text-embedding-3-small)
 *  - chat generation (gpt-4o-mini) with JSON-safe output
 *  - file text extraction (PDF via pdf-parse, images via gpt-4o-mini vision)
 */
const openai_1 = __importDefault(require("openai"));
// pdf-parse ships a CJS build whose bundled exports trip up TS's call
// signature resolution, so require() it and cast.
const pdfParse = require('pdf-parse');
let client = null;
function getClient() {
    if (!client) {
        const key = process.env.OPENAI_API_KEY;
        if (!key)
            throw new Error('OPENAI_API_KEY is not configured');
        client = new openai_1.default({ apiKey: key });
    }
    return client;
}
function aiConfigured() {
    return Boolean(process.env.OPENAI_API_KEY);
}
function getGenModel() {
    return process.env.OPENAI_GEN_MODEL || 'gpt-4o-mini';
}
function getEmbeddingModel() {
    return process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
}
/** Batches embedding requests (max 100 texts per request) to stay well within rate limits. */
function embedTexts(texts) {
    return __awaiter(this, void 0, void 0, function* () {
        const model = getEmbeddingModel();
        const out = [];
        for (let i = 0; i < texts.length; i += 100) {
            const batch = texts.slice(i, i + 100);
            const res = yield getClient().embeddings.create({ model, input: batch });
            const sorted = [...res.data].sort((a, b) => a.index - b.index);
            out.push(...sorted.map((d) => d.embedding));
        }
        return out;
    });
}
function embedText(text) {
    return __awaiter(this, void 0, void 0, function* () {
        const [embedding] = yield embedTexts([text]);
        return embedding;
    });
}
function stripCodeFences(raw) {
    return raw.replace(/```json/gi, '').replace(/```/g, '').trim();
}
/** Asks the model to reply with valid JSON and parses it. Throws on bad JSON. */
function generateJson(system_1, user_1) {
    return __awaiter(this, arguments, void 0, function* (system, user, opts = {}) {
        var _a, _b, _c, _d;
        const res = yield getClient().chat.completions.create({
            model: getGenModel(),
            messages: [
                { role: 'system', content: system },
                { role: 'user', content: user },
            ],
            response_format: { type: 'json_object' },
            temperature: (_a = opts.temperature) !== null && _a !== void 0 ? _a : 0.3,
            max_tokens: (_b = opts.maxTokens) !== null && _b !== void 0 ? _b : 2048,
        });
        const content = (_d = (_c = res.choices[0]) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.content;
        if (!content)
            throw new Error('Empty LLM response');
        return JSON.parse(stripCodeFences(content));
    });
}
/** Plain text generation (no JSON parsing). */
function generateText(system_1, user_1) {
    return __awaiter(this, arguments, void 0, function* (system, user, opts = {}) {
        var _a, _b, _c, _d, _e;
        const res = yield getClient().chat.completions.create({
            model: getGenModel(),
            messages: [
                { role: 'system', content: system },
                { role: 'user', content: user },
            ],
            temperature: (_a = opts.temperature) !== null && _a !== void 0 ? _a : 0.3,
            max_tokens: (_b = opts.maxTokens) !== null && _b !== void 0 ? _b : 1024,
        });
        return (_e = (_d = (_c = res.choices[0]) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.content) !== null && _e !== void 0 ? _e : '';
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
            const visionModel = process.env.OPENAI_VISION_MODEL || getGenModel();
            try {
                const res = yield getClient().chat.completions.create({
                    model: visionModel,
                    messages: [
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: 'Ekstrak SEMUA teks dan butiran yang kelihatan dalam imej ini, termasuk nama, nombor, saiz, kuantiti, tarikh dan sebarang teks lain. Sila senaraikan dalam format teks biasa.',
                                },
                                {
                                    type: 'image_url',
                                    image_url: { url: `data:${mime};base64,${base64}` },
                                },
                            ],
                        },
                    ],
                    max_tokens: 1024,
                });
                return (_c = (_b = (_a = res.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) !== null && _c !== void 0 ? _c : '';
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
