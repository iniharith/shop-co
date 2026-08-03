"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeCursor = exports.encodeCursor = void 0;
const util_1 = require("util");
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;
const utf8Decoder = new util_1.TextDecoder('utf-8', { fatal: true });
const isValidIsoDate = (value) => {
    const date = new Date(value);
    return !Number.isNaN(date.getTime()) && date.toISOString() === value;
};
const isTaskCursor = (value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return false;
    const cursor = value;
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
const encodeCursor = (cursor) => {
    if (!isTaskCursor(cursor))
        throw new Error('Invalid cursor');
    return Buffer.from(JSON.stringify({
        version: 1,
        updatedAt: cursor.updatedAt,
        id: cursor.id,
    }), 'utf8').toString('base64url');
};
exports.encodeCursor = encodeCursor;
const decodeCursor = (value) => {
    if (typeof value !== 'string' || !BASE64URL_PATTERN.test(value)) {
        throw new Error('Invalid cursor');
    }
    try {
        const bytes = Buffer.from(value, 'base64url');
        if (bytes.toString('base64url') !== value)
            throw new Error('Invalid cursor');
        const cursor = JSON.parse(utf8Decoder.decode(bytes));
        if (!isTaskCursor(cursor))
            throw new Error('Invalid cursor');
        return cursor;
    }
    catch (_a) {
        throw new Error('Invalid cursor');
    }
};
exports.decodeCursor = decodeCursor;
