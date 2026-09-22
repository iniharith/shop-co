/**
 * Coded by Harith
 * Kampungcetak (R)
 *
 * Synchronises workbook-backed prices into the storefront and backend seed catalogs.
 * Usage: node sync_catalog_from_workbook.js <workbook.xlsx> [--write]
 */
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const workbookPath = path.resolve(process.argv[2] || 'prices.xlsx');
const shouldWrite = process.argv.includes('--write');
const frontendPath = path.resolve('frontend/src/constants/dummy-products.ts');
const backendPath = path.resolve('backend/src/shared/catalog/catalogProducts.ts');

if (!fs.existsSync(workbookPath)) throw new Error(`Workbook not found: ${workbookPath}`);

const workbook = xlsx.readFile(workbookPath, { cellDates: false });
const rowsBySheet = new Map(
  workbook.SheetNames.map(name => [
    name,
    xlsx.utils.sheet_to_json(workbook.Sheets[name], { header: 1, defval: null, raw: true, range: 0 }),
  ]),
);

const requiredSheets = [
  'BIZ CARD', 'A3 FLYERS', 'A4 FLYERS', 'A5 FLYERS', 'MONEY PACKET', 'WIND FLAG',
  'DTF', 'STICKER', 'DISPLAY SYSTEM', 'LASER', 'KAD KAHWIN', 'PHOTOBOOK', 'FRAME',
  'BAJU SUBLIMATION', 'I CARD', 'BUTTON BADGE', 'BANNER BUNTING', 'CANVAS BAG',
  'NON WOVEN BAG', 'PAPER BAG',
];
for (const sheet of requiredSheets) {
  if (!rowsBySheet.has(sheet)) throw new Error(`Required worksheet is missing: ${sheet}`);
}

const sheet = name => rowsBySheet.get(name);
const cell = (name, row, column) => sheet(name)?.[row - 1]?.[column - 1] ?? null;
const clean = value => String(value ?? '').replace(/\u00a0/g, ' ').replace(/\ufffd/g, '').trim();
const money = value => {
  if (typeof value === 'number') return Number(value.toFixed(2));
  const text = clean(value);
  if (!text || /^x$/i.test(text)) return null;
  const numericText = text.replace(/,/g, '').replace(/RM/gi, '').replace(/[^0-9.-]/g, '');
  if (!numericText || numericText === '-' || numericText === '.') return null;
  const parsed = Number(numericText);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : null;
};
const quantity = value => {
  if (typeof value === 'number') return value;
  const parsed = Number.parseInt(clean(value).replace(/,/g, ''), 10);
  return Number.isFinite(parsed) ? parsed : null;
};
const option = (name, labels, extra = {}) => ({
  name,
  ...extra,
  options: labels.map(label => ({ label, priceAdd: 0 })),
});
const matrix = (pricingData, hideQuantityGrid = false) => ({ enabled: true, hideQuantityGrid, pricingData });

const readCatalogArray = (filePath, declaration) => {
  const text = fs.readFileSync(filePath, 'utf8');
  const declarationIndex = text.indexOf(declaration);
  if (declarationIndex < 0) throw new Error(`Could not find ${declaration} in ${filePath}`);
  const equals = text.indexOf('=', declarationIndex);
  const start = text.indexOf('[', equals);
  let depth = 0;
  let quote = '';
  let escaped = false;
  let end = -1;
  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === '[') depth += 1;
    if (char === ']') {
      depth -= 1;
      if (depth === 0) {
        end = index;
        break;
      }
    }
  }
  if (end < 0) throw new Error(`Could not find catalog array end in ${filePath}`);
  const products = Function(`"use strict"; return (${text.slice(start, end + 1)});`)();
  return { text, start, end, products };
};

const frontendFile = readCatalogArray(frontendPath, 'export const dummyProducts');
const backendFile = readCatalogArray(backendPath, 'export const catalogProducts');
const products = frontendFile.products;
const originalFrontendIds = new Set(products.map(product => product._id));
const productById = new Map(products.map(product => [product._id, product]));
const changedIds = new Set();

const createProduct = ({ id, name, category, price, image, description }) => ({
  _id: id,
  name,
  description: description || `High-quality ${name} printing based on Kampung Cetak's current selling-price schedule.`,
  price,
  originalPrice: price,
  discount: 0,
  rating: 5,
  reviews: 0,
  category,
  images: [image],
  colors: ['Standard'],
  sizes: ['Standard'],
  printingOptions: [],
});

const upsert = (id, patch, create = null) => {
  let product = productById.get(id);
  if (!product) {
    if (!create) throw new Error(`Catalog product does not exist: ${id}`);
    product = createProduct({ id, ...create });
    products.push(product);
    productById.set(id, product);
  }
  Object.assign(product, patch);
  if (patch.price !== undefined) {
    product.originalPrice = patch.originalPrice ?? patch.price;
    product.discount = patch.discount ?? 0;
  }
  changedIds.add(id);
  return product;
};

const priceRows = (name, startRow, endRow, qtyColumn, priceColumn) => {
  const prices = {};
  for (let row = startRow; row <= endRow; row += 1) {
    const qty = quantity(cell(name, row, qtyColumn));
    const price = money(cell(name, row, priceColumn));
    if (qty !== null && price !== null) prices[String(qty)] = price;
  }
  return prices;
};

// Business card: every material/finish combination is a separate valid choice.
{
  const quantities = Array.from({ length: 7 }, (_, index) => quantity(cell('BIZ CARD', 3, index + 2)));
  const definitions = [
    [5, '260GSM / MATT LAMINATE'], [6, '310GSM / MATT LAMINATE'], [7, '350GSM / MATT LAMINATE'],
    [10, '260GSM / NO LAMINATE'], [11, '310GSM / NO LAMINATE'], [12, '350GSM / NO LAMINATE'],
    [15, '260GSM / UV VARNISH'],
    [19, '260GSM / MATT LAM 1SIDE SPOT UV'], [20, '260GSM / MATT LAM 2 SIDE SPOT UV'],
    [22, '310GSM / MATT LAM 1SIDE SPOT UV'], [23, '310GSM / MATT LAM 2 SIDE SPOT UV'],
    [25, '350GSM / MATT LAM 1SIDE SPOT UV'], [26, '350GSM / MATT LAM 2 SIDE SPOT UV'],
  ];
  const pricingData = definitions.map(([row, label]) => {
    const quantityPrices = {};
    quantities.forEach((qty, index) => {
      const price = money(cell('BIZ CARD', row, index + 2));
      if (qty !== null && price !== null) quantityPrices[String(qty)] = price;
    });
    return { material: label, laminate: '', quantityPrices };
  });
  upsert('prod-112', {
    price: 22,
    printingOptions: [option('Material / Finish', definitions.map(([, label]) => label))],
    matrixPricing: matrix(pricingData),
  });
}

// Flyers: merge the A3, A4 and A5 price tables without relying on merged-cell positions.
{
  const tables = [
    ['A3 FLYERS', 'A3', '80gsm Simili Paper', 5, 43, 1, 2, 3],
    ['A3 FLYERS', 'A3', '100gsm Simili Paper', 5, 25, 5, 6, 7],
    ['A3 FLYERS', 'A3', '85gsm Art Paper', 50, 58, 1, null, 2],
    ['A3 FLYERS', 'A3', '105gsm Art Paper', 52, 71, 5, 6, 7],
    ['A3 FLYERS', 'A3', '128gsm Art Paper', 50, 88, 9, 10, 11],
    ['A3 FLYERS', 'A3', '157gsm Art Paper', 51, 89, 13, 14, 15],
    ['A3 FLYERS', 'A3', '260gsm Art Card', 94, 105, 1, 2, 3],
    ['A3 FLYERS', 'A3', '310gsm Art Card', 94, 105, 5, 6, 7],
    ['A4 FLYERS', 'A4', '80gsm Simili Paper', 4, 42, 1, 2, 3],
    ['A4 FLYERS', 'A4', '100gsm Simili Paper', 4, 24, 5, 6, 7],
    ['A4 FLYERS', 'A4', '85gsm Art Paper', 48, 56, 1, null, 2],
    ['A4 FLYERS', 'A4', '105gsm Art Paper', 48, 67, 4, 5, 6],
    ['A4 FLYERS', 'A4', '128gsm Art Paper', 47, 85, 8, 9, 10],
    ['A4 FLYERS', 'A4', '157gsm Art Paper', 47, 85, 12, 13, 14],
    ['A4 FLYERS', 'A4', '260gsm Art Card', 91, 102, 1, 2, 3],
    ['A4 FLYERS', 'A4', '310gsm Art Card', 91, 102, 5, 6, 7],
    ['A5 FLYERS', 'A5', '80gsm Simili Paper', 6, 21, 1, 2, 3],
    ['A5 FLYERS', 'A5', '105gsm Art Paper', 27, 38, 1, 2, 3],
    ['A5 FLYERS', 'A5', '128gsm Art Paper', 26, 41, 5, 6, 7],
    ['A5 FLYERS', 'A5', '157gsm Art Paper', 27, 42, 9, 10, 11],
    ['A5 FLYERS', 'A5', '260gsm Art Card', 47, 57, 1, 2, 3],
    ['A5 FLYERS', 'A5', '310gsm Art Card', 48, 58, 5, 6, 7],
  ];
  const byCombination = new Map();
  const add = (material, side, qty, size, price) => {
    if (qty === null || price === null) return;
    const key = `${material}\u0000${side}`;
    if (!byCombination.has(key)) byCombination.set(key, { material, laminate: side, quantityPrices: {} });
    const row = byCombination.get(key);
    row.quantityPrices[String(qty)] ||= {};
    row.quantityPrices[String(qty)][size] = price;
  };
  for (const [sheetName, size, material, startRow, endRow, qtyCol, singleCol, doubleCol] of tables) {
    for (let row = startRow; row <= endRow; row += 1) {
      const qty = quantity(cell(sheetName, row, qtyCol));
      if (singleCol) add(material, '4C + 0C', qty, size, money(cell(sheetName, row, singleCol)));
      if (doubleCol) add(material, '4C + 4C', qty, size, money(cell(sheetName, row, doubleCol)));
    }
  }
  const materials = ['80gsm Simili Paper', '100gsm Simili Paper', '85gsm Art Paper', '105gsm Art Paper', '128gsm Art Paper', '157gsm Art Paper', '260gsm Art Card', '310gsm Art Card'];
  const pricingData = [];
  for (const material of materials) {
    for (const side of ['4C + 0C', '4C + 4C']) {
      const row = byCombination.get(`${material}\u0000${side}`);
      if (row && Object.keys(row.quantityPrices).length) pricingData.push(row);
    }
  }
  upsert('prod-110', {
    price: 115.6,
    printingOptions: [option('Material', materials), option('Printing Sides', ['4C + 0C', '4C + 4C'])],
    matrixPricing: matrix(pricingData),
  });
}

// Money packets.
{
  const packs = ['5pcs/pack', '8pcs/pack', '10pcs/pack'];
  const pricingData = [];
  for (const [orientation, qtyCol, firstPriceCol] of [['VERTICAL', 1, 2], ['HORIZONTAL', 6, 7]]) {
    packs.forEach((pack, index) => pricingData.push({
      material: orientation,
      laminate: pack,
      quantityPrices: priceRows('MONEY PACKET', 4, 22, qtyCol, firstPriceCol + index),
    }));
  }
  upsert('prod-127', {
    price: 294.6,
    printingOptions: [option('Material / Orientation', ['VERTICAL', 'HORIZONTAL']), option('Packaging', packs)],
    matrixPricing: matrix(pricingData),
  });
}

const tierStart = value => {
  const numbers = clean(value).match(/\d+/g)?.map(Number) || [];
  return numbers[0] ?? null;
};

const windFlagPatch = () => {
  const sizes = ['2.8 Meters', '3.4 Meters', '4.5 Meters'];
  const pricingData = sizes.map((size, index) => {
    const quantityPrices = {};
    for (let row = 6; row <= 10; row += 1) {
      const start = tierStart(cell('WIND FLAG', row, 1));
      const price = money(cell('WIND FLAG', row, index + 2));
      if (start !== null && price !== null) quantityPrices[String(start)] = price;
    }
    return { material: size, laminate: '', priceMode: 'perUnit', quantityPrices };
  });
  return {
    price: 222,
    printingOptions: [option('Format', sizes)],
    matrixPricing: matrix(pricingData, true),
  };
};
upsert('prod-109', windFlagPatch());
if (productById.has('prod-264')) upsert('prod-264', windFlagPatch());

// DTF and UV DTF are distinct products in the workbook.
{
  const makeDtf = ({ id, name, category, labels, columns, rows, image }) => {
    const pricingData = labels.map((label, index) => {
      const quantityPrices = {};
      rows.forEach(row => {
        const start = tierStart(cell('DTF', row, 1));
        const price = money(cell('DTF', row, columns[index]));
        if (start !== null && price !== null) quantityPrices[String(start)] = price;
      });
      return { material: label, laminate: '', priceMode: 'perUnit', quantityPrices };
    });
    upsert(id, {
      price: pricingData[0].quantityPrices['1'],
      printingOptions: [option('Format', labels)],
      matrixPricing: matrix(pricingData, true),
    }, { id, name, category, price: pricingData[0].quantityPrices['1'], image });
  };
  makeDtf({
    id: 'prod-268', name: 'UV DTF Sticker', category: 'uv-dtf-sticker',
    labels: ['A4', 'A3', '300mm x 1000mm'], columns: [2, 3, 4], rows: [6, 7, 8],
    image: '/images/products/STICKER.png',
  });
  makeDtf({
    id: 'prod-269', name: 'DTF Sticker', category: 'dtf-sticker',
    labels: ['A2 per meter (1000mm x 580mm)', 'A2 (420mm x 580mm)', 'A3 (420mm x 285mm)', 'A4 (205mm x 285mm)'],
    columns: [2, 3, 4, 5], rows: [15, 16, 17], image: '/images/products/STICKER.png',
  });
}

// Sticker sheets: exact order totals by material, size and quantity.
{
  const materials = [
    ['MIRROCOTE STICKER', 3, 4, 12],
    ['PP WHITE STICKER', 17, 18, 26],
    ['TRANSPARENT STICKER', 30, 31, 39],
  ];
  const quantities = Array.from({ length: 10 }, (_, index) => quantity(cell('STICKER', 3, index + 3)));
  const sizes = Array.from({ length: 9 }, (_, index) => `${index + 3}cm`);
  const pricingData = [];
  for (const [material, headerRow, startRow, endRow] of materials) {
    for (let row = startRow; row <= endRow; row += 1) {
      const size = clean(cell('STICKER', row, 1)).toLowerCase();
      const quantityPrices = {};
      quantities.forEach((qty, index) => {
        const price = money(cell('STICKER', row, index + 3));
        if (qty !== null && price !== null) quantityPrices[String(qty)] = price;
      });
      pricingData.push({ material, laminate: size, quantityPrices });
    }
  }
  upsert('prod-117', {
    price: 4.6,
    printingOptions: [option('Material', materials.map(([label]) => label)), option('Packaging / Size', sizes)],
    matrixPricing: matrix(pricingData),
  });
}

// Display-system products.
const pricedOptions = (base, name, entries) => [{
  name,
  options: entries.map(([label, price]) => ({ label, priceAdd: Number((price - base).toFixed(2)) })),
}];
const simplePricePatch = (base, name, entries) => ({
  price: base,
  printingOptions: entries?.length ? pricedOptions(base, name, entries) : [],
  matrixPricing: { enabled: false, pricingData: [] },
});
const rollUpEntries = [
  ['76cm X 200cm (Economy)', 157.74], ['76cm X 200cm', 163.74], ['85cm X 200cm (Economy)', 176.07],
  ['85cm X 200cm (Luxury)', 353.07], ['85cm X 200cm (Luxury) (2 Side)', 556.14], ['120cm X 200cm (Luxury)', 518.73],
];
const miniXEntries = [['Mini X Stand A4 [Table]', 25.5], ['Mini X Stand A3 [Table]', 30.75], ['X Stand [Black] (24X72INCH)', 87]];
const tripodEntries = [['Tripod Stand', 87.9], ['T Bar Stand', 119.4], ['T Bar Stand [Water Base]', 147.9]];
const standeeEntries = [['Wooden Easel Stand', 90], ['H Stand [Slanted]', 94.5], ['Human Standee', 96], ['H Stand [Straight]', 111]];
upsert('prod-108', simplePricePatch(157.74, 'Type & Size', rollUpEntries));
upsert('prod-152', simplePricePatch(25.5, 'Type & Size', miniXEntries));
upsert('prod-150', simplePricePatch(87.9, 'Type & Size', tripodEntries));
upsert('prod-149', simplePricePatch(90, 'Type & Size', standeeEntries));
upsert('prod-107', simplePricePatch(658.5, 'Type & Size', [['Pop Up Table', 658.5], ['Pop Up Backdrop Display (Soft Case)', 2043], ['Pop Up Backdrop Display (Hard Case)', 2622]]));
upsert('prod-151', simplePricePatch(33, 'Type & Size', [['Water Bag', 33]]));
if (productById.has('prod-260')) upsert('prod-260', simplePricePatch(2043, 'Type & Size', [['Pop Up Backdrop Display (Soft Case)', 2043], ['Pop Up Backdrop Display (Hard Case)', 2622]]));
if (productById.has('prod-261')) upsert('prod-261', simplePricePatch(658.5, 'Type & Size', [['Pop Up Table', 658.5]]));
if (productById.has('prod-263')) upsert('prod-263', simplePricePatch(157.74, 'Type & Size', rollUpEntries));
if (productById.has('prod-265')) upsert('prod-265', simplePricePatch(90, 'Type & Size', standeeEntries));
if (productById.has('prod-266')) upsert('prod-266', simplePricePatch(87.9, 'Type & Size', tripodEntries));
if (productById.has('prod-267')) upsert('prod-267', simplePricePatch(33, 'Type & Size', [['Water Bag', 33]]));

// Laser engraving and Quran pointer.
{
  const laserEntries = [];
  for (let row = 3; row <= 11; row += 1) laserEntries.push([`WOOD / ${clean(cell('LASER', row, 1))}`, money(cell('LASER', row, 2))]);
  for (let row = 15; row <= 17; row += 1) laserEntries.push([`ACRYLIC / ${clean(cell('LASER', row, 1))}`, money(cell('LASER', row, 2))]);
  upsert('prod-270', simplePricePatch(23, 'Material / Size', laserEntries), {
    id: 'prod-270', name: 'Laser Engraving', category: 'laser-engraving', price: 23, image: '/images/products/frame.png',
  });
  const pointerPrices = {};
  for (let row = 20; row <= 22; row += 1) pointerPrices[String(quantity(cell('LASER', row, 1)))] = money(cell('LASER', row, 2));
  upsert('prod-271', {
    price: pointerPrices['1'],
    printingOptions: [option('Package', ['PENUNJUK ALQURAN'])],
    matrixPricing: matrix([{ material: 'PENUNJUK ALQURAN', laminate: '', quantityPrices: pointerPrices }]),
  }, { id: 'prod-271', name: 'Penunjuk Al-Quran', category: 'quran-pointer', price: pointerPrices['1'], image: '/images/products/frame.png' });
}

// Wedding card packages and fixed-price add-ons.
{
  const definitions = [[2, 4, 9], [12, 14, 19], [22, 24, 29], [32, 34, 39], [42, 44, 49], [52, 54, 59]];
  const pricingData = definitions.map(([labelRow, startRow, endRow]) => ({
    material: clean(cell('KAD KAHWIN', labelRow, 1)),
    laminate: '',
    quantityPrices: priceRows('KAD KAHWIN', startRow, endRow, 1, 2),
  }));
  const currentAddons = productById.get('prod-142')?.printingOptions?.find(entry => /addon/i.test(entry.name));
  const addonByLabel = new Map((currentAddons?.options || []).map(entry => [entry.label.toLowerCase(), entry.priceAdd]));
  const addonRows = [];
  for (let row = 62; row <= 68; row += 1) {
    const label = clean(cell('KAD KAHWIN', row, 1));
    const workbookPrice = money(cell('KAD KAHWIN', row, 2));
    const knownFallback = label.toLowerCase() === 'sticker' ? 70 : 0;
    const existingPrice = addonByLabel.get(label.toLowerCase());
    addonRows.push({
      label: label.replace(/\b\w/g, character => character.toUpperCase()),
      priceAdd: workbookPrice ?? (existingPrice > 0 ? existingPrice : knownFallback),
    });
  }
  upsert('prod-142', {
    price: 88,
    printingOptions: [
      option('Package', pricingData.map(row => row.material)),
      { name: 'Addons', isMultiSelect: true, priceMode: 'fixed', options: addonRows },
    ],
    matrixPricing: matrix(pricingData),
  });
}

// Photobook uses a combined size/page choice so every selectable combination has an exact price.
{
  const combinations = ['6X6 / 40 PAGES', '6X6 / 60 PAGES', '6X6 / 100 PAGES', '6X8 / 40 PAGES', '6X8 / 60 PAGES', '6X8 / 100 PAGES'];
  const covers = [
    ['HARDCOVER', [109, 119, 129, 129, 139, 149]],
    ['SOFTCOVER', [49, 59, 69, 55, 65, 75]],
  ];
  const pricingData = covers.flatMap(([cover, prices]) => combinations.map((combination, index) => ({
    material: cover,
    laminate: combination,
    priceMode: 'perUnit',
    quantityPrices: { '1': prices[index] },
  })));
  upsert('prod-153', {
    price: 109,
    printingOptions: [option('Material', covers.map(([cover]) => cover)), option('Packaging / Size & Pages', combinations)],
    matrixPricing: matrix(pricingData, true),
  });
}

// Islamic Khat rows map sequentially to prod-200..prod-258; prod-227 is the second ASMAULHUSNA design.
{
  for (let row = 3; row <= 61; row += 1) {
    const id = `prod-${200 + row - 3}`;
    const workbookName = clean(cell('FRAME', row, 1));
    const currentPrice = money(cell('FRAME', row, 2));
    const tarpaulin = money(cell('FRAME', row, 3));
    const artCanvas = money(cell('FRAME', row, 4));
    const hasMaterialPrices = tarpaulin > 0 && artCanvas > 0;
    const price = hasMaterialPrices ? tarpaulin : currentPrice;
    if (!(price > 0)) throw new Error(`FRAME row ${row} has no usable selling price.`);
    const printingOptions = hasMaterialPrices
      ? [{ name: 'Material', options: [{ label: 'TARPAULIN', priceAdd: 0 }, { label: 'ART CANVAS', priceAdd: Number((artCanvas - tarpaulin).toFixed(2)) }] }]
      : [];
    upsert(id, { price, printingOptions, matrixPricing: { enabled: false, pricingData: [] } }, {
      id,
      name: workbookName,
      category: 'Islamic Khat',
      price,
      image: '/images/products/frame.png',
      description: `High-quality Islamic Khat - ${workbookName}`,
    });
  }
  const portraitOptions = [];
  for (let row = 66; row <= 83; row += 1) {
    const label = clean(cell('FRAME', row, 3)).replace(/\s+/g, '');
    const price = money(cell('FRAME', row, 4));
    portraitOptions.push({ label, priceAdd: Number((price - 38).toFixed(2)) });
  }
  upsert('prod-134', {
    price: 38,
    printingOptions: [{ name: 'Size', options: portraitOptions }],
    matrixPricing: { enabled: false, pricingData: [] },
  });
}

// Sublimation shirt quantity tiers are per-shirt prices; add-ons are per shirt except design service.
{
  const tierStarts = [1, 10, 20, 30, 50, 100];
  const typeLabels = [];
  const pricingData = [];
  for (let row = 3; row <= 10; row += 1) {
    const label = clean(cell('BAJU SUBLIMATION', row, 1)).replace('KORPORATLONGSLEEVE', 'KORPORAT LONGSLEEVE');
    typeLabels.push(label);
    const quantityPrices = {};
    tierStarts.forEach((start, index) => { quantityPrices[String(start)] = money(cell('BAJU SUBLIMATION', row, index + 3)); });
    pricingData.push({ material: label, laminate: '', priceMode: 'perUnit', quantityPrices });
  }
  const addOns = [];
  for (let row = 13; row <= 27; row += 1) addOns.push({ label: clean(cell('BAJU SUBLIMATION', row, 1)), priceAdd: money(cell('BAJU SUBLIMATION', row, 2)) });
  upsert('prod-131', {
    price: 39,
    printingOptions: [
      option('Material / Baju Type', typeLabels),
      { name: 'Add Ons', isMultiSelect: true, priceMode: 'perUnit', options: addOns },
      { name: 'Design Service', priceMode: 'fixed', options: [{ label: 'USE EXISTING DESIGN', priceAdd: 0 }, { label: 'NEW DESIGN', priceAdd: 100 }] },
    ],
    matrixPricing: matrix(pricingData, true),
  });
}

// I Card and button badges.
upsert('prod-272', simplePricePatch(30, 'Type', [['I CARD', 30]]), {
  id: 'prod-272', name: 'I Card', category: 'i-card', price: 30, image: '/images/products/BUSINESS CARD.png',
});
{
  const entries = [];
  for (let row = 2; row <= 5; row += 1) entries.push([clean(cell('BUTTON BADGE', row, 1)), money(cell('BUTTON BADGE', row, 2))]);
  upsert('prod-139', simplePricePatch(2, 'Type', entries));
}

// Banner and bunting are sold per square foot; unavailable combinations are omitted.
{
  const combinations = [];
  const materials = ['320GSM', '400GSM', 'WHITE STICKER', 'TRANSPARENT STICKER', 'SYNTHETIC PAPER'];
  const methods = [['SOLVENT', 3], ['ECO SOLVENT', 4], ['UV PRINT', 5]];
  methods.forEach(([method, row]) => materials.forEach((material, index) => {
    const price = money(cell('BANNER BUNTING', row, index + 2));
    if (price !== null) combinations.push({ label: `${material} / ${method}`, price });
  }));
  const pricingData = combinations.map(entry => ({ material: entry.label, laminate: '', priceMode: 'perUnit', quantityPrices: { '1': entry.price } }));
  const patch = {
    price: 2,
    printingOptions: [option('Material / Print Type', combinations.map(entry => entry.label))],
    matrixPricing: matrix(pricingData, true),
  };
  upsert('prod-100', patch);
  upsert('prod-101', JSON.parse(JSON.stringify(patch)));
  upsert('prod-103', simplePricePatch(20, 'Type', [['SIGNBOARD / SQFT', 20], ['3D SIGNBOARD STANDARD / SQFT', 35], ['3D SIGNBOARD PREMIUM / SQFT', 50]]));
}

const bagPatch = (name, definitions) => {
  const pricingData = [];
  const labels = [];
  for (const definition of definitions) {
    const sizeLabel = clean(cell(name, definition.labelRow, 1));
    for (let column = 2; column <= definition.lastPriceColumn; column += 1) {
      const printSize = clean(cell(name, definition.headerRow, column));
      if (!printSize) continue;
      const label = `${sizeLabel} / ${printSize}`;
      labels.push(label);
      pricingData.push({
        material: label,
        laminate: '',
        quantityPrices: priceRows(name, definition.startRow, definition.endRow, 1, column),
      });
    }
  }
  return {
    printingOptions: [option('Material / Bag Size & Print Size', labels)],
    matrixPricing: matrix(pricingData),
    price: pricingData[0].quantityPrices[String(quantity(cell(name, definitions[0].startRow, 1)))],
  };
};
upsert('prod-130', bagPatch('CANVAS BAG', [
  { labelRow: 5, headerRow: 7, startRow: 9, endRow: 24, lastPriceColumn: 7 },
  { labelRow: 28, headerRow: 30, startRow: 32, endRow: 47, lastPriceColumn: 7 },
  { labelRow: 50, headerRow: 52, startRow: 54, endRow: 69, lastPriceColumn: 6 },
]));
upsert('prod-129', bagPatch('NON WOVEN BAG', [
  { labelRow: 2, headerRow: 4, startRow: 6, endRow: 21, lastPriceColumn: 6 },
  { labelRow: 23, headerRow: 25, startRow: 27, endRow: 42, lastPriceColumn: 6 },
  { labelRow: 45, headerRow: 47, startRow: 49, endRow: 64, lastPriceColumn: 5 },
]));

// Paper bags: two materials x three finishes x ten designs.
{
  const tables = [
    ['157gsm Art Paper', '1 Side Gloss Lamination (4C + 0C)', 7, 21],
    ['157gsm Art Paper', '1 Side Matt Lamination (4C + 0C)', 27, 41],
    ['157gsm Art Paper', '1 Side Matt Lamination + 1 Side Spot UV (4C + 0C)', 47, 61],
    ['210gsm Art Card', '1 Side Gloss Lamination (4C + 0C)', 68, 82],
    ['210gsm Art Card', '1 Side Matt Lamination (4C + 0C)', 89, 103],
    ['210gsm Art Card', '1 Side Matt Lamination + 1 Side Spot UV (4C + 0C)', 110, 124],
  ];
  const designs = Array.from({ length: 10 }, (_, index) => `PB${String(index + 1).padStart(2, '0')}`);
  const pricingData = [];
  for (const [material, lamination, startRow, endRow] of tables) {
    designs.forEach((design, index) => pricingData.push({
      material,
      lamination,
      design,
      quantityPrices: priceRows('PAPER BAG', startRow, endRow, 1, index + 2),
    }));
  }
  upsert('prod-114', {
    price: 860.2,
    printingOptions: [
      option('Material', ['157gsm Art Paper', '210gsm Art Card']),
      option('Lamination', tables.slice(0, 3).map(([, label]) => label)),
      option('Design', designs),
    ],
    matrixPricing: matrix(pricingData),
  });
}

// Backend catalog gets the exact same workbook-driven fields while retaining backend stock/image data.
const backendProducts = backendFile.products;
const backendById = new Map(backendProducts.map(product => [product.catalogId, product]));
for (const id of changedIds) {
  const frontend = productById.get(id);
  let backend = backendById.get(id);
  if (!backend) {
    backend = {
      catalogId: id,
      name: frontend.name,
      description: frontend.description,
      price: frontend.price,
      category: frontend.category,
      images: frontend.images || [],
      sizes: (frontend.sizes || ['Standard']).map(size => ({ size: typeof size === 'string' ? size : size.size, stock: typeof size === 'string' ? 1000 : Number(size.stock || 1000) })),
      rating: frontend.rating ?? 0,
    };
    backendProducts.push(backend);
    backendById.set(id, backend);
  }
  Object.assign(backend, {
    name: frontend.name,
    description: frontend.description,
    price: frontend.price,
    category: frontend.category,
    originalPrice: frontend.originalPrice,
    discount: frontend.discount,
    printingOptions: frontend.printingOptions || [],
    matrixPricing: frontend.matrixPricing || { enabled: false },
  });
}

const assertCatalog = () => {
  const ids = products.map(product => product._id);
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate frontend catalog IDs detected.');
  for (const id of changedIds) {
    const frontend = productById.get(id);
    const backend = backendById.get(id);
    if (!backend) throw new Error(`Backend product missing after sync: ${id}`);
    for (const key of ['price', 'originalPrice', 'discount']) {
      if (frontend[key] !== backend[key]) throw new Error(`${id} differs between catalogs at ${key}.`);
    }
    for (const key of ['printingOptions', 'matrixPricing']) {
      if (JSON.stringify(frontend[key] || null) !== JSON.stringify(backend[key] || null)) {
        throw new Error(`${id} differs between catalogs at ${key}.`);
      }
    }
    if (!Number.isFinite(frontend.price) || frontend.price < 0) throw new Error(`${id} has an invalid base price.`);
    for (const row of frontend.matrixPricing?.pricingData || []) {
      if (!Object.keys(row.quantityPrices || {}).length) throw new Error(`${id} contains an empty matrix row.`);
      for (const value of Object.values(row.quantityPrices)) {
        const values = typeof value === 'object' ? Object.values(value) : [value];
        if (values.some(item => !Number.isFinite(Number(item)) || Number(item) < 0)) throw new Error(`${id} contains an invalid matrix price.`);
      }
    }
  }
};

const assertMatrixChoices = () => {
  for (const id of changedIds) {
    const product = productById.get(id);
    if (!product.matrixPricing?.enabled) continue;
    const options = product.printingOptions || [];
    const dimensions = [
      ['material', options.find(entry => /material|format|package/i.test(entry.name))],
      [product.category === 'paper-bag' ? 'lamination' : 'laminate', options.find(entry => /lamination|sides|packaging/i.test(entry.name))],
      ['design', product.category === 'paper-bag' ? options.find(entry => /design|size/i.test(entry.name)) : undefined],
    ];
    for (const row of product.matrixPricing.pricingData) {
      for (const [field, entry] of dimensions) {
        if (!entry) continue;
        const value = row[field];
        if (!entry.options.some(choice => choice.label === value)) {
          throw new Error(`${id} matrix ${field} '${value}' is not a selectable catalog choice.`);
        }
      }
    }
  }
};

assertCatalog();
assertMatrixChoices();

const serializeCatalog = (file, catalog) => {
  const eol = file.text.includes('\r\n') ? '\r\n' : '\n';
  const json = JSON.stringify(catalog, null, 2).replace(/\n/g, eol);
  return `${file.text.slice(0, file.start)}${json}${file.text.slice(file.end + 1)}`;
};

if (shouldWrite) {
  fs.writeFileSync(frontendPath, serializeCatalog(frontendFile, products));
  fs.writeFileSync(backendPath, serializeCatalog(backendFile, backendProducts));
}

const matrixRows = [...changedIds].reduce((total, id) => total + (productById.get(id).matrixPricing?.pricingData?.length || 0), 0);
console.log(JSON.stringify({
  workbook: workbookPath,
  mode: shouldWrite ? 'written' : 'dry-run',
  changedProducts: changedIds.size,
  addedProducts: [...changedIds].filter(id => !originalFrontendIds.has(id)).length,
  matrixRows,
  productIds: [...changedIds].sort((a, b) => Number(a.split('-')[1]) - Number(b.split('-')[1])),
}, null, 2));
