const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeProductConfiguration } = require('../dist/shared/catalog/productConfiguration.js');
const { computeProductPricing } = require('../dist/shared/pricing/product-pricing.service.js');
const CartModel = require('../dist/infrastructure/db/models/cart.model.js').default;
const OrderModel = require('../dist/infrastructure/db/models/order.model.js').default;

const product = {
  _id: 'prod-201',
  catalogId: 'prod-201',
  name: '4QUL 24X48',
  description: '',
  category: 'Islamic Khat',
  price: 31,
  images: [
    '/images/products/4qul-24x48/mockup-01.webp',
    '/images/products/4qul-24x48/mockup-02.webp',
  ],
  sizes: [{ size: 'Standard', stock: 1000 }],
  printingOptions: [{
    name: 'Frame',
    options: [{ label: 'Black', priceAdd: 12 }],
  }],
};
const configurableProduct = {
  ...product,
  category: 'banner',
  images: [product.images[0]],
};

test('normalizes a variation into stable artwork fields from the server image', () => {
  const normalized = normalizeProductConfiguration({ ...product, printingOptions: [] }, {
    version: 99,
    fulfillmentSize: 'Forged',
    selections: [],
    design: {
      type: 'variation',
      label: 'Design 02',
      variantId: 'forged',
      variantLabel: 'forged',
      variantImage: 'https://attacker.invalid/image.png',
      image: 'https://attacker.invalid/image.png',
      variationIndex: 1,
      priceAdd: 999,
    },
  }, 'Standard');

  assert.equal(normalized.version, 1);
  assert.equal(normalized.fulfillmentSize, 'Standard');
  assert.deepEqual(normalized.design, {
    type: 'variation',
    label: '4QUL-24X48-M02',
    priceAdd: 0,
    variationIndex: 1,
    image: '/images/products/4qul-24x48/mockup-02.webp',
    variantId: 'prod-201:mockup-02',
    variantLabel: '4QUL-24X48-M02',
    variantImage: '/images/products/4qul-24x48/mockup-02.webp',
  });
});

test('rejects an unavailable variation index', () => {
  assert.throws(() => normalizeProductConfiguration({ ...product, printingOptions: [] }, {
    version: 1,
    fulfillmentSize: 'Standard',
    selections: [],
    design: { type: 'variation', label: '', variationIndex: 9 },
  }, 'Standard'), /Selected design is not available/);
});

test('canonicalizes option prices from product data', () => {
  const normalized = normalizeProductConfiguration(configurableProduct, {
    version: 1,
    fulfillmentSize: 'Standard',
    selections: [{ name: 'Frame', values: [{ label: 'Black', priceAdd: 999 }] }],
    design: { type: 'upload', label: 'Forged', priceAdd: 999 },
  }, 'Standard');

  assert.equal(normalized.selections[0].values[0].priceAdd, 12);
  assert.deepEqual(normalized.design, { type: 'upload', label: 'Upload Artwork', priceAdd: 0 });
  assert.equal(computeProductPricing(configurableProduct, 2, normalized).lineTotal, 86);
});

test('rejects missing or forged required option selections', () => {
  assert.throws(() => normalizeProductConfiguration(configurableProduct, {
    version: 1,
    fulfillmentSize: 'Standard',
    selections: [],
    design: { type: 'upload', label: 'Upload Artwork' },
  }, 'Standard'), /Frame selection is required/);

  assert.throws(() => normalizeProductConfiguration(configurableProduct, {
    version: 1,
    fulfillmentSize: 'Standard',
    selections: [{ name: 'Frame', values: [{ label: 'Forged', priceAdd: -999 }] }],
    design: { type: 'upload', label: 'Upload Artwork' },
  }, 'Standard'), /Invalid Frame selection/);
});

test('ignores client prices for unknown option values', () => {
  const pricing = computeProductPricing(product, 2, {
    version: 1,
    fulfillmentSize: 'Standard',
    selections: [{ name: 'Frame', values: [{ label: 'Forged', priceAdd: 999 }] }],
  });

  assert.equal(pricing.unitPrice, 31);
  assert.equal(pricing.lineTotal, 62);
});

test('multiplies per-unit matrix tiers by the requested quantity', () => {
  const tieredProduct = {
    ...configurableProduct,
    price: 222,
    printingOptions: [{
      name: 'Format',
      options: [{ label: '2.8 Meters', priceAdd: 0 }],
    }],
    matrixPricing: {
      enabled: true,
      hideQuantityGrid: true,
      pricingData: [{
        material: '2.8 Meters',
        laminate: '',
        priceMode: 'perUnit',
        quantityPrices: { 1: 222, 3: 218, 6: 214 },
      }],
    },
  };
  const pricing = computeProductPricing(tieredProduct, 7, {
    version: 1,
    fulfillmentSize: 'Standard',
    selections: [{ name: 'Format', values: [{ label: '2.8 Meters', priceAdd: 999 }] }],
  });

  assert.equal(pricing.unitPrice, 214);
  assert.equal(pricing.lineTotal, 1498);
});

test('adds per-unit and once-per-order choices to matrix totals', () => {
  const matrixProduct = {
    ...configurableProduct,
    price: 10,
    printingOptions: [
      { name: 'Material', options: [{ label: 'Standard', priceAdd: 0 }] },
      { name: 'Add Ons', isMultiSelect: true, priceMode: 'perUnit', options: [{ label: 'Sleeve', priceAdd: 2 }] },
      { name: 'Design Service', priceMode: 'fixed', options: [{ label: 'New Design', priceAdd: 30 }] },
    ],
    matrixPricing: {
      enabled: true,
      pricingData: [{ material: 'Standard', laminate: '', quantityPrices: { 50: 100 } }],
    },
  };
  const pricing = computeProductPricing(matrixProduct, 50, {
    version: 1,
    fulfillmentSize: 'Standard',
    selections: [
      { name: 'Material', values: [{ label: 'Standard', priceAdd: 0 }] },
      { name: 'Add Ons', values: [{ label: 'Sleeve', priceAdd: 999 }] },
      { name: 'Design Service', values: [{ label: 'New Design', priceAdd: 999 }] },
    ],
  });

  assert.equal(pricing.lineTotal, 230);
});

test('rejects a matrix variation that has no workbook price', () => {
  const matrixProduct = {
    ...configurableProduct,
    price: 10,
    printingOptions: [
      { name: 'Material', options: [{ label: '80gsm', priceAdd: 0 }, { label: '85gsm', priceAdd: 0 }] },
      { name: 'Printing Sides', options: [{ label: '4C + 0C', priceAdd: 0 }, { label: '4C + 4C', priceAdd: 0 }] },
    ],
    matrixPricing: {
      enabled: true,
      pricingData: [{ material: '85gsm', laminate: '4C + 4C', quantityPrices: { 100: 100 } }],
    },
  };

  assert.throws(() => computeProductPricing(matrixProduct, 100, {
    version: 1,
    fulfillmentSize: 'Standard',
    selections: [
      { name: 'Material', values: [{ label: '85gsm', priceAdd: 0 }] },
      { name: 'Printing Sides', values: [{ label: '4C + 0C', priceAdd: 0 }] },
    ],
  }), /Selected product variation is not available/);
});

test('cart and order schemas persist explicit variation fields', () => {
  for (const model of [CartModel, OrderModel]) {
    const productsPath = model === CartModel ? 'items' : 'products';
    const lineSchema = model.schema.path(productsPath).schema;
    const configurationSchema = lineSchema.path('configuration').schema;
    assert.ok(configurationSchema.path('design.variantId'));
    assert.ok(configurationSchema.path('design.variantLabel'));
    assert.ok(configurationSchema.path('design.variantImage'));
  }
});
