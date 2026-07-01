/**
 * Coded by Harith
 * Kampungcetak ®
 */
const fs = require('fs');
let css = fs.readFileSync('frontend/src/app/globals.css', 'utf8');

// Remove existing integral font faces
css = css.replace(/@font-face\s*\{[\s\S]*?font-family:\s*"integral"[\s\S]*?\}/g, '');

// Replace h1, h2 integral mapping with the new rule
css = css.replace(/h1,\s*h2\s*\{[\s\S]*?font-family:\s*"integral";\s*\}/g, 'h1, h2, h3, h4, h5, h6, .font-bold, .font-semibold, .font-extrabold, .font-black, b, strong {\n    font-family: "provicali" !important;\n  }');

// Add provicali font-face at the top
css = '@font-face {\n  font-family: "provicali";\n  src: url("/fonts/Provicali.otf");\n}\n\n' + css;

fs.writeFileSync('frontend/src/app/globals.css', css);
console.log('Updated globals.css');
