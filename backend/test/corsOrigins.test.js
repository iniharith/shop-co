const test = require('node:test');
const assert = require('node:assert/strict');
const { allowedCorsOrigins, isAllowedCorsOrigin } = require('../dist/shared/utils/corsOrigins.js');

test('credentialed CORS accepts known and configured origins only', () => {
  const allowed = allowedCorsOrigins({ NODE_ENV: 'production', CORS_ALLOWED_ORIGINS: 'https://preview.example.com' });
  assert.equal(isAllowedCorsOrigin('https://kampungcetak.com', allowed), true);
  assert.equal(isAllowedCorsOrigin('https://preview.example.com', allowed), true);
  assert.equal(isAllowedCorsOrigin('https://evil.example.com', allowed), false);
  assert.equal(isAllowedCorsOrigin('https://kampungcetak.com.evil.example.com', allowed), false);
  assert.equal(isAllowedCorsOrigin('null', allowed), false);
  assert.equal(isAllowedCorsOrigin('http://localhost:3000', allowed), false);
  assert.equal(isAllowedCorsOrigin(undefined, allowed), true);
});
