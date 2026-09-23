const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeProductConfiguration } = require('../dist/shared/catalog/productConfiguration.js');
const { cartPriceChanged, computeProductPricing } = require('../dist/shared/pricing/product-pricing.service.js');
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

test('uses the selected banner material rate for customer-entered square feet', () => {
  const banner = {
    ...configurableProduct,
    price: 2,
    areaPricing: { enabled: true, unit: 'ft', pricePerSquareUnit: 2, minimumArea: 0, rounding: 'none' },
    printingOptions: [{
      name: 'Material / Print Type',
      options: [{ label: '320GSM / SOLVENT', priceAdd: 0 }, { label: '400GSM / ECO SOLVENT', priceAdd: 0 }],
    }],
    matrixPricing: {
      enabled: true,
      pricingData: [
        { material: '320GSM / SOLVENT', laminate: '', priceMode: 'perUnit', quantityPrices: { 1: 2 } },
        { material: '400GSM / ECO SOLVENT', laminate: '', priceMode: 'perUnit', quantityPrices: { 1: 3.5 } },
      ],
    },
  };
  const configuration = {
    version: 1,
    fulfillmentSize: 'Standard',
    area: { width: 2, height: 5, unit: 'ft', squareUnits: 10 },
    selections: [{ name: 'Material / Print Type', values: [{ label: '400GSM / ECO SOLVENT', priceAdd: 0 }] }],
  };
  assert.equal(computeProductPricing(banner, 3, configuration).lineTotal, 105);
  assert.throws(() => computeProductPricing(banner, 3, { ...configuration, selections: [] }), /not available/);
});

test('custom customer choice names still select the linked matrix price', () => {
  const product = {
    ...configurableProduct,
    price: 999,
    printingOptions: [
      { name: 'Your Fabric', matrixField: 'material', options: [{ label: 'Canvas', priceAdd: 0 }] },
      { name: 'Coating Choice', matrixField: 'laminate', options: [{ label: 'Matte', priceAdd: 0 }] },
      { name: 'Artwork Style', matrixField: 'design', options: [{ label: 'Classic', priceAdd: 0 }] },
    ],
    matrixPricing: { enabled: true, pricingData: [{ material: 'Canvas', laminate: 'Matte', design: 'Classic', priceMode: 'perUnit', quantityPrices: { 1: 12 } }] },
  };
  const configuration = { version: 1, fulfillmentSize: 'Standard', selections: [
    { name: 'Your Fabric', values: [{ label: 'Canvas', priceAdd: 0 }] },
    { name: 'Coating Choice', values: [{ label: 'Matte', priceAdd: 0 }] },
    { name: 'Artwork Style', values: [{ label: 'Classic', priceAdd: 0 }] },
  ] };
  assert.equal(computeProductPricing(product, 2, configuration).lineTotal, 24);
  assert.throws(() => computeProductPricing(product, 2, { ...configuration, selections: configuration.selections.slice(0, 2) }), /not available/);
});

test('rejects quantities without an exact total-price matrix entry', () => {
  const matrixProduct = {
    ...configurableProduct,
    printingOptions: [{ name: 'Material', options: [{ label: 'Standard', priceAdd: 0 }] }],
    matrixPricing: {
      enabled: true,
      pricingData: [{ material: 'Standard', laminate: '', priceMode: 'total', quantityPrices: { 100: 22, 200: 30 } }],
    },
  };
  const config = { version: 1, fulfillmentSize: 'Standard', selections: [{ name: 'Material', values: [{ label: 'Standard', priceAdd: 0 }] }] };
  assert.equal(computeProductPricing(matrixProduct, 100, config).lineTotal, 22);
  assert.equal(computeProductPricing(matrixProduct, 200, config).lineTotal, 30);
  assert.throws(() => computeProductPricing(matrixProduct, 99, config), /no published price/);
  assert.throws(() => computeProductPricing(matrixProduct, 101, config), /no published price/);
  assert.throws(() => computeProductPricing(matrixProduct, 201, config), /no published price/);
});

test('per-unit quantity tiers switch at their published minimums', () => {
  const matrixProduct = {
    ...configurableProduct,
    printingOptions: [{ name: 'Material', options: [{ label: 'Standard', priceAdd: 0 }] }],
    matrixPricing: {
      enabled: true,
      pricingData: [{ material: 'Standard', laminate: '', priceMode: 'perUnit', quantityPrices: { 10: 29, 20: 25, 30: 24 } }],
    },
  };
  const config = { version: 1, fulfillmentSize: 'Standard', selections: [{ name: 'Material', values: [{ label: 'Standard', priceAdd: 0 }] }] };
  assert.throws(() => computeProductPricing(matrixProduct, 9, config), /below the minimum/);
  for (const [quantity, unitPrice] of [[10, 29], [19, 29], [20, 25], [29, 25], [30, 24]]) {
    assert.equal(computeProductPricing(matrixProduct, quantity, config).lineTotal, quantity * unitPrice);
  }
});

test('Flyer pricing size is distinct from the stock size and never falls back to another format', () => {
  const flyers = {
    ...configurableProduct,
    category: 'flyers',
    sizes: [{ size: 'Standard', stock: 1000 }],
    printingOptions: [{ name: 'Material', options: [{ label: '80gsm', priceAdd: 0 }] }],
    matrixPricing: {
      enabled: true,
      pricingData: [{ material: '80gsm', laminate: '', priceMode: 'total', quantityPrices: { 300: { A3: 208, A4: 115.6 } } }],
    },
  };
  const configuration = normalizeProductConfiguration(flyers, {
    version: 1, fulfillmentSize: 'Forged', pricingSize: 'A4',
    selections: [{ name: 'Material', values: [{ label: '80gsm', priceAdd: 0 }] }],
  }, 'Standard');
  assert.equal(configuration.fulfillmentSize, 'Standard');
  assert.equal(configuration.pricingSize, 'A4');
  assert.equal(computeProductPricing(flyers, 300, configuration).lineTotal, 115.6);
  assert.throws(() => computeProductPricing(flyers, 300, { ...configuration, pricingSize: 'A5' }), /Selected size has no published price/);
});

test('server recalculates custom area and preserves it in the order configuration', () => {
  const areaProduct = {
    ...configurableProduct,
    price: 20,
    printingOptions: [],
    areaPricing: { enabled: true, unit: 'ft', pricePerSquareUnit: 20, minimumArea: 1, rounding: 'none' },
  };
  const configuration = normalizeProductConfiguration(areaProduct, {
    version: 1, fulfillmentSize: 'Standard', selections: [],
    area: { width: 2, height: 3, unit: 'ft', squareUnits: 999 },
  }, 'Standard');
  assert.equal(configuration.area.squareUnits, 6);
  assert.equal(computeProductPricing(areaProduct, 1, configuration).lineTotal, 120);
  assert.throws(() => normalizeProductConfiguration(areaProduct, {
    version: 1, fulfillmentSize: 'Standard', selections: [],
    area: { width: -2, height: 3, unit: 'ft', squareUnits: -6 },
  }, 'Standard'), /valid custom size/);
});

test('checkout detects a changed cart quote to the nearest sen', () => {
  assert.equal(cartPriceChanged(19.90, 19.9), false);
  assert.equal(cartPriceChanged(19.90, 19.91), true);
  assert.equal(cartPriceChanged(undefined, 19.9), true);
});

test('manual-quote products reject quantities above their approved maximum', () => {
  const productWithLimit = { ...configurableProduct, maximumQuantity: 50 };
  assert.equal(computeProductPricing(productWithLimit, 50).lineTotal, 50 * productWithLimit.price);
  assert.throws(() => computeProductPricing(productWithLimit, 51), /manual quote/);
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
    assert.ok(configurationSchema.path('pricingSize'));
    assert.ok(configurationSchema.path('area.width'));
  }
});
