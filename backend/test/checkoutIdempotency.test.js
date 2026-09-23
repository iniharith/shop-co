const test = require('node:test');
const assert = require('node:assert/strict');
const OrderModel = require('../dist/infrastructure/db/models/order.model.js').default;

test('checkout keys have a unique sparse database index', () => {
  const index = OrderModel.schema.indexes().find(([fields]) => fields.checkoutKey === 1);
  assert.ok(index, 'checkout key index is missing');
  assert.equal(index[1].unique, true);
  assert.equal(index[1].sparse, true);
});
