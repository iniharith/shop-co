/**
 * Coded by Harith
 * Kampungcetak ®
 * Thin wrapper around the OpenAI SDK used by the AI engine:
 *  - text embedding (text-embedding-3-small)
 *  - chat generation (gpt-4o-mini) with JSON-safe output
 *  - file text extraction (PDF via pdf-parse, images via gpt-4o-mini vision)
 */
import OpenAI from 'openai';

// pdf-parse ships a CJS build whose bundled exports trip up TS's call
// signature resolution, so require() it and cast.
const pdfParse = require('pdf-parse') as (
  buffer: Buffer,
  options?: { max?: number }
) => Promise<{ text: string }>;

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error('OPENAI_API_KEY is not configured');
    client = new OpenAI({ apiKey: key });
  }
  return client;
}

export function aiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function getGenModel(): string {
  return process.env.OPENAI_GEN_MODEL || 'gpt-4o-mini';
}

export function getEmbeddingModel(): string {
  return process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
}

/** Batches embedding requests (max 100 texts per request) to stay well within rate limits. */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const model = getEmbeddingModel();
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += 100) {
    const batch = texts.slice(i, i + 100);
    const res = await getClient().embeddings.create({ model, input: batch });
    const sorted = [...res.data].sort((a, b) => a.index - b.index);
    out.push(...sorted.map((d) => d.embedding));
  }
  return out;
}

export async function embedText(text: string): Promise<number[]> {
  const [embedding] = await embedTexts([text]);
  return embedding;
}

interface GenerateJsonOptions {
  temperature?: number;
  maxTokens?: number;
}

function stripCodeFences(raw: string): string {
  return raw.replace(/```json/gi, '').replace(/```/g, '').trim();
}

/** Asks the model to reply with valid JSON and parses it. Throws on bad JSON. */
export async function generateJson<T>(
  system: string,
  user: string,
  opts: GenerateJsonOptions = {}
): Promise<T> {
  const res = await getClient().chat.completions.create({
    model: getGenModel(),
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    response_format: { type: 'json_object' },
    temperature: opts.temperature ?? 0.3,
    max_tokens: opts.maxTokens ?? 2048,
  });
  const content = res.choices[0]?.message?.content;
  if (!content) throw new Error('Empty LLM response');
  return JSON.parse(stripCodeFences(content)) as T;
}

/** Plain text generation (no JSON parsing). */
export async function generateText(
  system: string,
  user: string,
  opts: GenerateJsonOptions = {}
): Promise<string> {
  const res = await getClient().chat.completions.create({
    model: getGenModel(),
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: opts.temperature ?? 0.3,
    max_tokens: opts.maxTokens ?? 1024,
  });
  return res.choices[0]?.message?.content ?? '';
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
    const visionModel = process.env.OPENAI_VISION_MODEL || getGenModel();
    try {
      const res = await getClient().chat.completions.create({
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
      return res.choices[0]?.message?.content ?? '';
    } catch (err) {
      console.error('[ai] vision extraction failed:', (err as Error).message);
      return '';
    }
  }

  // Unsupported type — return nothing, verification will rely on filename only.
  return '';
}
