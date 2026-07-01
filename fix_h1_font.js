/**
 * Coded by Harith
 * Kampungcetak ®
 */
const fs = require('fs');
let css = fs.readFileSync('frontend/src/app/globals.css', 'utf8');

// replace only the font-family inside the h1, h2 block
css = css.replace(/h1,\s*h2\s*\{\s*font-family:\s*"integral";\s*\}/g, 'h1, h2 {\n    font-family: var(--font-provicali-ampersand), "integral";\n  }');

fs.writeFileSync('frontend/src/app/globals.css', css);
console.log('Fixed globals.css');
