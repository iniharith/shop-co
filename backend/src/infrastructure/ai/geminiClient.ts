/**
 * Coded by Harith
 * Kampungcetak ®
 * Thin wrapper around the Google Gemini REST API used by the AI engine:
 *  - text embedding (gemini-embedding-001, 3072 dims)
 *  - chat generation (gemini-2.0-flash) with JSON-safe output
 *  - file text extraction (PDF via pdf-parse, images via Gemini vision)
 * Mirrors the openaiClient.ts API so aiProvider.ts can switch between them.
 */

// pdf-parse ships a CJS build whose bundled exports trip up TS's call
// signature resolution, so require() it and cast.
const pdfParse = require('pdf-parse') as (
  buffer: Buffer,
  options?: { max?: number }
) => Promise<{ text: string }>;

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export interface GenerateJsonOptions {
  temperature?: number;
  maxTokens?: number;
}

function getKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not configured');
  return key;
}

export function aiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function getGenModel(): string {
  return process.env.GEMINI_GEN_MODEL || 'gemini-flash-latest';
}

export function getEmbeddingModel(): string {
  return process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';
}

/** pgvector indexes cap at 2000 dims, so we request a fixed, index-safe dimensionality. */
function getEmbeddingDim(): number {
  return parseInt(process.env.AI_EMBEDDING_DIM || '768', 10) || 768;
}

async function geminiFetch(path: string, body: unknown): Promise<any> {
  const res = await fetch(`${API_BASE}${path}`, {
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
      const err = await res.json();
      detail = err?.error?.message || JSON.stringify(err);
    } catch {
      detail = await res.text().catch(() => '');
    }
    throw new Error(`Gemini API ${res.status}: ${detail || res.statusText}`);
  }
  return res.json();
}

/** Batches embedding requests (max 100 texts per request) to stay well within rate limits. */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const model = getEmbeddingModel();
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += 100) {
    const batch = texts.slice(i, i + 100);
    const data = await geminiFetch(`/models/${model}:batchEmbedContents`, {
      requests: batch.map((text) => ({
        model: `models/${model}`,
        content: { parts: [{ text }] },
      })),
      outputDimensionality: getEmbeddingDim(),
    });
    out.push(...((data.embeddings || []) as any[]).map((e) => e.values || []));
  }
  return out;
}

export async function embedText(text: string): Promise<number[]> {
  const model = getEmbeddingModel();
  const data = await geminiFetch(`/models/${model}:embedContent`, {
    model: `models/${model}`,
    content: { parts: [{ text }] },
    outputDimensionality: getEmbeddingDim(),
  });
  return data?.embedding?.values || [];
}

function stripCodeFences(raw: string): string {
  return raw.replace(/```json/gi, '').replace(/```/g, '').trim();
}

async function generateContent(
  system: string,
  user: string,
  opts: GenerateJsonOptions,
  jsonMode: boolean
): Promise<string> {
  const generationConfig: Record<string, unknown> = {
    temperature: opts.temperature ?? 0.3,
    maxOutputTokens: opts.maxTokens ?? 2048,
  };
  if (jsonMode) generationConfig.responseMimeType = 'application/json';

  const data = await geminiFetch(`/models/${getGenModel()}:generateContent`, {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig,
  });
  const parts = (data?.candidates?.[0]?.content?.parts || []) as any[];
  return parts.map((p) => p.text || '').join('');
}

/** Asks the model to reply with valid JSON and parses it. Throws on bad JSON. */
export async function generateJson<T>(
  system: string,
  user: string,
  opts: GenerateJsonOptions = {}
): Promise<T> {
  const content = await generateContent(system, user, opts, true);
  if (!content) throw new Error('Empty LLM response');
  return JSON.parse(stripCodeFences(content)) as T;
}

/** Plain text generation (no JSON parsing). */
export async function generateText(
  system: string,
  user: string,
  opts: GenerateJsonOptions = {}
): Promise<string> {
  return generateContent(system, user, opts, false);
}

/** Extracts plain text from an uploaded file's buffer. */
export async function extractTextFromBuffer(
  buffer: Buffer,
  mimetype: string,
  filename = 'file'
): Promise<string> {
  const mime = (mimetype || '').toLowerCase();
  const name = (filename || '').toLowerCase();

  if (mime === 'application/pdf' || name.endsWith('.pdf')) {
    try {
      const parsed = await pdfParse(buffer);
      return (parsed.text || '').slice(0, 30_000);
    } catch (err) {
      console.error('[ai] pdf-parse failed:', (err as Error).message);
      return '';
    }
  }

  if (mime.startsWith('image/') || /\.(png|jpe?g|webp|tiff|gif|bmp)$/.test(name)) {
    const base64 = buffer.toString('base64');
    const prompt = 'Ekstrak SEMUA teks dan butiran yang kelihatan dalam imej ini, termasuk nama, nombor, saiz, kuantiti, tarikh dan sebarang teks lain. Sila senaraikan dalam format teks biasa.';
    try {
      const data = await geminiFetch(`/models/${getGenModel()}:generateContent`, {
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
      const parts = (data?.candidates?.[0]?.content?.parts || []) as any[];
      return parts.map((p) => p.text || '').join('');
    } catch (err) {
      console.error('[ai] vision extraction failed:', (err as Error).message);
      return '';
    }
  }

  // Unsupported type — return nothing, verification will rely on filename only.
  return '';
}
