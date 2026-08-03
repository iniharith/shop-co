const test = require('node:test');
const assert = require('node:assert/strict');
const { aggregateCompletionAnalytics } = require('../dist/shared/utils/queueAnalytics.js');

const from = new Date('2026-07-01T16:00:00.000Z');
const to = new Date('2026-07-04T15:59:59.999Z');

test('uses the first historical transition into completion', () => {
  const result = aggregateCompletionAnalytics([{
    createdAt: '2026-07-01T16:00:00.000Z',
    status: 'DELIVERED',
    statusUpdatedAt: '2026-07-03T06:00:00.000Z',
    statusHistory: [
      { fromStatus: null, toStatus: 'PLACED', fromIsDone: false, toIsDone: false, changedAt: '2026-07-01T16:00:00.000Z' },
      { fromStatus: 'PLACED', toStatus: 'SHIPPED', fromIsDone: false, toIsDone: false, changedAt: '2026-07-02T04:00:00.000Z' },
      { fromStatus: 'SHIPPED', toStatus: 'DELIVERED', fromIsDone: false, toIsDone: false, changedAt: '2026-07-03T06:00:00.000Z' },
    ],
  }], from, to);

  assert.equal(result.completedInRange, 1);
  assert.equal(result.historicalCompletedInRange, 1);
  assert.equal(result.legacyEstimatedCompletedInRange, 0);
  assert.equal(result.avgCompletionHours, 12);
  assert.deepEqual([...result.completedByDate], [['2026-07-02', 1]]);
});

test('uses statusUpdatedAt only for tasks without history and reports fallback quality', () => {
  const result = aggregateCompletionAnalytics([{
    createdAt: '2026-07-01T16:00:00.000Z',
    status: 'DELIVERED',
    statusUpdatedAt: '2026-07-03T04:00:00.000Z',
  }], from, to);

  assert.equal(result.completedInRange, 1);
  assert.equal(result.historicalCompletedInRange, 0);
  assert.equal(result.legacyEstimatedCompletedInRange, 1);
  assert.equal(result.avgCompletionHours, 36);
});

test('records done-state completion and excludes events outside the range', () => {
  const result = aggregateCompletionAnalytics([{
    createdAt: '2026-06-20T00:00:00.000Z',
    status: 'IN_DESIGN',
    isDone: true,
    statusHistory: [
      { fromStatus: null, toStatus: 'IN_DESIGN', fromIsDone: false, toIsDone: false, changedAt: '2026-06-20T00:00:00.000Z' },
      { fromStatus: 'IN_DESIGN', toStatus: 'IN_DESIGN', fromIsDone: false, toIsDone: true, changedAt: '2026-06-30T00:00:00.000Z' },
    ],
  }], from, to);

  assert.equal(result.completedInRange, 0);
  assert.equal(result.avgCompletionHours, null);
});
