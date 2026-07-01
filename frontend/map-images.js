/**
 * Coded by Harith
 * Kampungcetak ®
 */
const fs = require('fs');

let content = fs.readFileSync('src/constants/dummy-products.ts', 'utf8');

// The dummyProducts is a big array. We can use a replacer that checks the "category" and updates "images".
// Wait, "category" is usually something like "banner", "display-item", etc.
// But some might just have "category": "Corporate Gift", etc.

// We need to parse and replace. The safest way is to evaluate it, modify it, and write it back, but it's typescript.
// Let's use regex that finds "category": "something" and updates the following "images": [ ... ]

content = content.replace(/"category":\s*"([^"]+)",\s*"images":\s*\[\s*"[^"]*"\s*\]/g, (match, category) => {
    let imgFile = 'digital_printing.png';
    const cat = category.toLowerCase();
    
    if (cat.includes('display') || cat.includes('flag') || cat.includes('backdrop') || cat.includes('stand')) {
        imgFile = 'display_item.png';
    } else if (cat.includes('digital offset') || cat.includes('flyer') || cat.includes('booklet') || cat.includes('business card') || cat.includes('paper bag') || cat.includes('certificate')) {
        imgFile = 'digital_offset.png';
    } else if (cat.includes('corporate gift') || cat.includes('trophy') || cat.includes('keychain') || cat.includes('magnet') || cat.includes('lanyard') || cat.includes('mug') || cat.includes('pen') || cat.includes('calendar') || cat.includes('notebook')) {
        imgFile = 'corporate_gift.png';
    } else if (cat.includes('apparel') || cat.includes('tshirt') || cat.includes('t shirt')) {
        imgFile = 'apparel.png';
    } else if (cat.includes('frame') || cat.includes('portrait') || cat.includes('clock') || cat.includes('khat')) {
        imgFile = 'frame.png';
    } else if (cat.includes('wedding') || cat.includes('hantaran') || cat.includes('door gift') || cat.includes('welcome board') || cat.includes('button badge')) {
        imgFile = 'wedding_product.png';
    } else if (cat.includes('food') || cat.includes('menu') || cat.includes('table tent') || cat.includes('pouch')) {
        imgFile = 'food_packaging.png';
    } else {
        imgFile = 'digital_printing.png'; // default
    }

    return `"category": "${category}",
    "images": [
      "/images/products/${imgFile}"
    ]`;
});

fs.writeFileSync('src/constants/dummy-products.ts', content);
console.log('Done updating images to local generated images!');
