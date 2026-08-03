import { TextDecoder } from 'util';

export interface TaskCursor {
  version: 1;
  updatedAt: string;
  id: string;
}

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;
const utf8Decoder = new TextDecoder('utf-8', { fatal: true });

const isValidIsoDate = (value: string): boolean => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
};

const isTaskCursor = (value: unknown): value is TaskCursor => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;

  const cursor = value as Record<string, unknown>;
  const keys = Object.keys(cursor);
  return keys.length === 3
    && keys.includes('version')
    && keys.includes('updatedAt')
    && keys.includes('id')
    && cursor.version === 1
    && typeof cursor.updatedAt === 'string'
    && isValidIsoDate(cursor.updatedAt)
    && typeof cursor.id === 'string'
    && OBJECT_ID_PATTERN.test(cursor.id);
};

export const encodeCursor = (cursor: TaskCursor): string => {
  if (!isTaskCursor(cursor)) throw new Error('Invalid cursor');

  return Buffer.from(JSON.stringify({
    version: 1,
    updatedAt: cursor.updatedAt,
    id: cursor.id,
  }), 'utf8').toString('base64url');
};

export const decodeCursor = (value: string): TaskCursor => {
  if (typeof value !== 'string' || !BASE64URL_PATTERN.test(value)) {
    throw new Error('Invalid cursor');
  }

  try {
    const bytes = Buffer.from(value, 'base64url');
    if (bytes.toString('base64url') !== value) throw new Error('Invalid cursor');

    const cursor: unknown = JSON.parse(utf8Decoder.decode(bytes));
    if (!isTaskCursor(cursor)) throw new Error('Invalid cursor');
    return cursor;
  } catch {
    throw new Error('Invalid cursor');
  }
};
