const fs = require('fs');
let content = fs.readFileSync('frontend/src/constants/dummy-products.ts', 'utf8');

const m = content.match(/_id: "prod-116"[\s\S]*?(?=\s+},\s+{\s+_id: "prod-117")/);
if(m) {
    const rep = m[0].replace('_id: "prod-116"', '_id: "prod-127"');
    const regex2 = /_id: "prod-127"[\s\S]*?(?=\s+},\s+{\s+_id: "prod-128")/;
    content = content.replace(regex2, rep);
    fs.writeFileSync('frontend/src/constants/dummy-products.ts', content);
    console.log('Fixed prod-127!');
} else {
    console.log('prod-116 not found');
}
