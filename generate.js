const fs = require('fs');

const categories = [
  { label: 'DIGITAL PRINTING', subs: ['banner', 'bunting', 'car-sticker', 'board-printing', 'wall-sticker', 'glass-sticker'] },
  { label: 'DISPLAY ITEM', subs: ['personalised-flag', 'popup-backdrop-display', 'roll-up-stand', 'wind-flag'] },
  { label: 'DIGITAL OFFSET', subs: ['flyers', 'booklet', 'business-card', 'corporate-folder', 'paper-bag', 'certificate', 'stamp', 'sticker'] },
  { label: 'CORPORATE GIFT', subs: ['crystal-plaque-trophy', 'acrylic-trophy', 'acrylic-keychain', 'fridge-magnet', 'lanyard', 'mug', 'pen', 'calendar', 'notebook', 'money-packet', 'premium-gift'] },
  { label: 'APPAREL', subs: ['non-woven-bag', 'canvas-bag', 'sublimation-tshirt', 'cotton-t-shirt'] },
  { label: 'FRAME', subs: ['islamic-khat', 'portrait', 'clock'] },
  { label: 'WEDDING PRODUCT', subs: ['wedding-bunting', 'wedding-banner', 'arrow-bunting', 'button-badge', 'cek-hantaran', 'door-gift', 'wedding-card', 'welcome-board'] },
  { label: 'FOOD PACKAGING', subs: ['menu-book', 'table-tent', 'table-display-stand', 'stand-pouch', 'food-sticker'] }
];

let idCounter = 100;
let products = [];

categories.forEach(cat => {
  cat.subs.forEach(sub => {
    let title = sub.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    products.push({
      _id: 'prod-' + (idCounter++),
      name: title,
      description: 'High-quality ' + title + ' with premium materials and vibrant printing. Perfect for ' + cat.label.toLowerCase() + ' needs.',
      price: Math.floor(Math.random() * 80) + 10,
      originalPrice: Math.floor(Math.random() * 100) + 90,
      discount: Math.floor(Math.random() * 20) + 5,
      rating: +(Math.random() * 2 + 3).toFixed(1),
      reviews: Math.floor(Math.random() * 300) + 20,
      category: sub,
      images: [
        'https://images.pexels.com/photos/1762851/pexels-photo-1762851.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1036396/pexels-photo-1036396.jpeg?auto=compress&cs=tinysrgb&w=800'
      ],
      colors: ['Red', 'Blue', 'Green', 'Black', 'White'],
      sizes: ['Small', 'Medium', 'Large', 'Standard', 'Custom']
    });
  });
});

const fileContent = 'import { IProduct } from "@/types/IProduct";\n\nexport const dummyProducts: IProduct[] = ' + JSON.stringify(products, null, 2) + ';\n';

fs.writeFileSync('frontend/src/constants/dummy-products.ts', fileContent);
console.log('Successfully generated ' + products.length + ' dummy products.');
