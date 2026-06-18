const fs = require('fs');
const content = fs.readFileSync('src/constants/dummy-products.ts', 'utf8');

let newContent = content.replace(/"name":\s*"([^"]+)"[\s\S]*?"images":\s*\[[\s\S]*?\]/g, (match, name) => {
    const encodedName = encodeURIComponent(name);
    const newImage = `"https://placehold.co/800x800/eeeeee/333333?text=" + encodedName + ""`;
    
    return match.replace(/"images":\s*\[[\s\S]*?\]/, '"images": [\n      ' + newImage + '\n    ]');
});

fs.writeFileSync('src/constants/dummy-products.ts', newContent);
console.log('Updated images!');
