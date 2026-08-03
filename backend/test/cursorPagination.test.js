const test = require('node:test');
const assert = require('node:assert/strict');
const {
  decodeCursor,
  encodeCursor,
} = require('../dist/shared/utils/cursorPagination.js');
const { sanitizeSensitiveText } = require('../dist/instrumentation.js');

const cursor = {
  version: 1,
  updatedAt: '2026-08-03T12:34:56.789Z',
  id: '507f1f77bcf86cd799439011',
};

const encodeRaw = (value) => Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');

test('cursor encoding is deterministic and round trips', () => {
  const encoded = encodeCursor(cursor);
  assert.equal(encodeCursor(cursor), encoded);
  assert.deepEqual(decodeCursor(encoded), cursor);
});

test('cursor output is URL-safe', () => {
  const encoded = encodeCursor(cursor);
  assert.match(encoded, /^[A-Za-z0-9_-]+$/);
  assert.doesNotMatch(encoded, /[+/=]/);
});

test('decoder rejects malformed cursors', () => {
  for (const value of ['', 'not+base64', 'a', Buffer.from('{').toString('base64url')]) {
    assert.throws(() => decodeCursor(value), /Invalid cursor/);
  }
  assert.throws(() => decodeCursor(encodeRaw({ ...cursor, extra: true })), /Invalid cursor/);
});

test('decoder rejects invalid dates', () => {
  assert.throws(
    () => decodeCursor(encodeRaw({ ...cursor, updatedAt: '2026-02-30T00:00:00.000Z' })),
    /Invalid cursor/,
  );
  assert.throws(
    () => decodeCursor(encodeRaw({ ...cursor, updatedAt: '2026-08-03' })),
    /Invalid cursor/,
  );
});

test('decoder rejects invalid ObjectIds', () => {
  assert.throws(
    () => decodeCursor(encodeRaw({ ...cursor, id: 'not-an-object-id' })),
    /Invalid cursor/,
  );
});

test('decoder rejects unsupported versions', () => {
  assert.throws(
    () => decodeCursor(encodeRaw({ ...cursor, version: 2 })),
    /Invalid cursor/,
  );
  assert.throws(
    () => decodeCursor(encodeRaw({ updatedAt: cursor.updatedAt, id: cursor.id })),
    /Invalid cursor/,
  );
});

test('sanitizer redacts query strings, credentials, and email addresses', () => {
  const sanitized = sanitizeSensitiveText(
    'GET /callback?token=secret Authorization: Bearer abc.def token=plain user@example.com',
  );

  assert.equal(
    sanitized,
    'GET /callback?[REDACTED] Authorization: Bearer [REDACTED] token=[REDACTED] [REDACTED_EMAIL]',
  );
});
