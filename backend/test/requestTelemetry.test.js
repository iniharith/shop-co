require('ts-node/register');
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  RingBuffer,
  percentile,
  routeTemplate,
  summarizeTraces,
} = require('../src/shared/utils/requestTelemetry.ts');

test('ring buffer retains only the newest values', () => {
  const buffer = new RingBuffer(2);
  buffer.push('first');
  buffer.push('second');
  buffer.push('third');
  assert.deepEqual(buffer.values(), ['second', 'third']);
});

test('route templates retain mount paths without request values or query strings', () => {
  assert.equal(
    routeTemplate('/api/tasks/customer-123/files?token=secret', '/:taskId/files'),
    '/api/tasks/:taskId/files',
  );
  assert.equal(routeTemplate('/unknown/customer@example.com?token=secret'), '/unmatched');
  assert.equal(routeTemplate('/health/live?check=secret', ['/health', '/health/live']), '/health/live');
});

test('percentile uses nearest-rank values', () => {
  assert.equal(percentile([40, 10, 30, 20], 0.5), 20);
  assert.equal(percentile([40, 10, 30, 20], 0.95), 40);
  assert.equal(percentile([], 0.95), 0);
});

test('summary limits data to the window and computes rate, errors, and latency', () => {
  const now = Date.parse('2026-09-11T12:05:00.000Z');
  const trace = (timestamp, durationMs, status = 200) => ({
    requestId: 'request-id', method: 'GET', route: '/api/test', status, durationMs, timestamp,
  });
  const result = summarizeTraces([
    trace('2026-09-11T12:00:00.000Z', 10),
    trace('2026-09-11T12:04:00.000Z', 20),
    trace('2026-09-11T12:04:30.000Z', 100, 503),
    trace('2026-09-11T11:59:59.999Z', 1000, 500),
  ], now);

  assert.equal(result.requests, 3);
  assert.equal(result.requestsPerMinute, 0.6);
  assert.equal(result.serverErrors, 1);
  assert.equal(result.errorRatePercent, 33.33);
  assert.deepEqual(result.latencyMs, { p50: 20, p95: 100 });
});
