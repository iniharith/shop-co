/**
 * Coded by Harith
 * Kampungcetak ®
 */
require('ts-node/register');
const React = require('react');
const { renderToString } = require('react-dom/server');
const { ProductDetails } = require('./frontend/src/components/page-sections/shop/product-details.tsx');
const { dummyProducts } = require('./frontend/src/constants/dummy-products.ts');

const product = dummyProducts.find(p => p._id === 'prod-141');

try {
  const html = renderToString(React.createElement(ProductDetails, { product }));
  console.log('RENDER SUCCESS! HTML length:', html.length);
} catch (e) {
  console.error('RENDER CRASHED!');
  console.error(e);
}
