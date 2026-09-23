const test = require('node:test');
const assert = require('node:assert/strict');
const { estimateCartWeight, selectCheapestShippingQuote, matchesQuotedShippingPrice } = require('../dist/shared/pricing/shippingQuote.js');

test('shipping weight is derived from cart contents', () => {
  assert.equal(estimateCartWeight([{ size: 'A4', quantity: 100 }]), 1);
  assert.equal(estimateCartWeight([{ size: 'A3', quantity: 200 }]), 3.39);
  assert.throws(() => estimateCartWeight([{ size: 'A4', quantity: -1 }]), /Invalid cart quantity/);
});

test('selects a valid provider quote and ignores invalid prices', () => {
  const quote = selectCheapestShippingQuote([{ quotations: [
    { pricing: { total_amount: '18.50' }, courier: { courier_name: 'First' } },
    { pricing: { total_amount: '12.00' }, courier: { courier_name: 'Second' } },
    { pricing: { total_amount: '-1' }, courier: { courier_name: 'Invalid' } },
  ] }]);
  assert.deepEqual(quote, { price: 12, courier: 'Second' });
  assert.equal(selectCheapestShippingQuote([{ quotations: [{ price: 'oops' }] }]), null);
});

test('browser-submitted shipping is only accepted when it matches the provider amount', () => {
  assert.equal(matchesQuotedShippingPrice(12, 12), true);
  assert.equal(matchesQuotedShippingPrice(0, 12), false);
  assert.equal(matchesQuotedShippingPrice(undefined, 12), false);
  assert.equal(matchesQuotedShippingPrice('12', 12), false);
});
