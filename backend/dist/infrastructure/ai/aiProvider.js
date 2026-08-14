"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMBEDDING_DIM = void 0;
exports.getActiveProvider = getActiveProvider;
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
 * Provider-agnostic facade for the AI engine. Picks OpenAI or Google Gemini
 * based on the AI_PROVIDER env var (default: openai).
 * Swappable at runtime — no code changes needed when switching providers.
 */
const openaiClient = __importStar(require("./openaiClient"));
const geminiClient = __importStar(require("./geminiClient"));
function getActiveProvider() {
    return (process.env.AI_PROVIDER || 'openai').toLowerCase() === 'gemini'
        ? 'gemini'
        : 'openai';
}
function backend() {
    return getActiveProvider() === 'gemini'
        ? geminiClient
        : openaiClient;
}
/** Embedding dimensionality the vector store must match for the active provider. */
exports.EMBEDDING_DIM = parseInt(process.env.AI_EMBEDDING_DIM || '1536', 10) || 1536;
function aiConfigured() {
    return backend().aiConfigured();
}
function getGenModel() {
    return backend().getGenModel();
}
function getEmbeddingModel() {
    return backend().getEmbeddingModel();
}
function embedTexts(texts) {
    return backend().embedTexts(texts);
}
function embedText(text) {
    return backend().embedText(text);
}
function generateJson(system, user, opts) {
    return backend().generateJson(system, user, opts);
}
function generateText(system, user, opts) {
    return backend().generateText(system, user, opts);
}
function extractTextFromBuffer(buffer, mimetype, filename) {
    return backend().extractTextFromBuffer(buffer, mimetype, filename);
}
