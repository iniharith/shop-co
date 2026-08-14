/**
 * Coded by Harith
 * Kampungcetak ®
 * Provider-agnostic facade for the AI engine. Picks OpenAI or Google Gemini
 * based on the AI_PROVIDER env var (default: openai).
 * Swappable at runtime — no code changes needed when switching providers.
 */
import * as openaiClient from './openaiClient';
import * as geminiClient from './geminiClient';

export type AiProvider = 'openai' | 'gemini';

export interface AiBackend {
  aiConfigured(): boolean;
  getGenModel(): string;
  getEmbeddingModel(): string;
  embedTexts(texts: string[]): Promise<number[][]>;
  embedText(text: string): Promise<number[]>;
  generateJson<T>(
    system: string,
    user: string,
    opts?: { temperature?: number; maxTokens?: number }
  ): Promise<T>;
  generateText(
    system: string,
    user: string,
    opts?: { temperature?: number; maxTokens?: number }
  ): Promise<string>;
  extractTextFromBuffer(buffer: Buffer, mimetype: string, filename?: string): Promise<string>;
}

export function getActiveProvider(): AiProvider {
  return (process.env.AI_PROVIDER || 'openai').toLowerCase() === 'gemini'
    ? 'gemini'
    : 'openai';
}

function backend(): AiBackend {
  return getActiveProvider() === 'gemini'
    ? (geminiClient as unknown as AiBackend)
    : (openaiClient as unknown as AiBackend);
}

/** Embedding dimensionality the vector store must match for the active provider. */
export const EMBEDDING_DIM = parseInt(process.env.AI_EMBEDDING_DIM || '1536', 10) || 1536;

export function aiConfigured(): boolean {
  return backend().aiConfigured();
}

export function getGenModel(): string {
  return backend().getGenModel();
}

export function getEmbeddingModel(): string {
  return backend().getEmbeddingModel();
}

export function embedTexts(texts: string[]): Promise<number[][]> {
  return backend().embedTexts(texts);
}

export function embedText(text: string): Promise<number[]> {
  return backend().embedText(text);
}

export function generateJson<T>(
  system: string,
  user: string,
  opts?: { temperature?: number; maxTokens?: number }
): Promise<T> {
  return backend().generateJson(system, user, opts);
}

export function generateText(
  system: string,
  user: string,
  opts?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  return backend().generateText(system, user, opts);
}

export function extractTextFromBuffer(
  buffer: Buffer,
  mimetype: string,
  filename?: string
): Promise<string> {
  return backend().extractTextFromBuffer(buffer, mimetype, filename);
}
