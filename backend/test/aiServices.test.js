const test = require('node:test');
const assert = require('node:assert/strict');
const { chunkText } = require('../dist/application/ai/aiIndexService.js');
const { buildExpectedDetails } = require('../dist/application/ai/aiVerificationService.js');

test('chunkText splits long text into <=800-char chunks and preserves order', () => {
  const long = 'a'.repeat(2000);
  const chunks = chunkText(long);
  assert.equal(chunks.length, 3);
  assert.equal(chunks[0].length, 800);
  assert.equal(chunks[1].length, 800);
  assert.equal(chunks[2].length, 400);
  assert.equal(chunks.join(''), long);
});

test('chunkText collapses whitespace and returns empty array for blank input', () => {
  assert.deepEqual(chunkText('   '), []);
  assert.deepEqual(chunkText(''), []);
  const chunks = chunkText('hello   world\n\n  again');
  assert.deepEqual(chunks, ['hello world again']);
});

test('chunkText honors a custom chunk size', () => {
  const chunks = chunkText('abcdefghij', 5);
  assert.deepEqual(chunks, ['abcde', 'fghij']);
});

test('buildExpectedDetails includes customer, order id, items and address', () => {
  const order = {
    _id: 'ord_1',
    customerName: 'Ahmad',
    products: [
      { productNameSnapshot: 'Banner', size: 'A3', quantity: 2 },
    ],
    address: {
      address: 'No 1', street: 'Jalan Merdeka', city: 'KL',
      state: 'Selangor', postalCode: '50000', country: 'Malaysia',
    },
    orderNotes: 'Sila bungkus kemas',
  };
  const expected = buildExpectedDetails(order, [{ title: 'Design banner', description: 'Hi-res' }], 'Nota fail');
  assert.ok(expected.includes('Nama pelanggan: Ahmad'));
  assert.ok(expected.includes('ID pesanan: ord_1'));
  assert.ok(expected.includes('- Banner | Saiz: A3 | Kuantiti: 2'));
  assert.ok(expected.includes('Alamat: No 1, Jalan Merdeka, KL, Selangor, 50000, Malaysia'));
  assert.ok(expected.includes('Nota pelanggan: Sila bungkus kemas'));
  assert.ok(expected.includes('Nota pada muat naik: Nota fail'));
  assert.ok(expected.includes('Task: Design banner'));
  assert.ok(expected.includes('Hi-res'));
});

test('buildExpectedDetails handles missing order fields gracefully', () => {
  const expected = buildExpectedDetails({ _id: 'ord_2' }, []);
  assert.ok(expected.includes('Nama pelanggan: N/A'));
  assert.ok(expected.includes('ID pesanan: ord_2'));
  assert.ok(expected.includes('Item dipesan: N/A'));
  assert.ok(!expected.includes('Alamat:'));
});

test('buildExpectedDetails supports manual items and filters deleted tasks', () => {
  const expected = buildExpectedDetails(
    { _id: 'ord_3', manualItemName: 'Tumbler', manualItemDescription: '500ml' },
    [
      { title: 'Active task', description: 'keep', isDeleted: false },
      { title: 'Deleted task', description: 'drop', isDeleted: true },
    ]
  );
  assert.ok(expected.includes('- Tumbler (500ml)'));
  assert.ok(expected.includes('Active task'));
  assert.ok(!expected.includes('Deleted task'));
});
