const fs = require('fs');

let content = fs.readFileSync('frontend/src/constants/index.ts', 'utf8');

const lines = content.split('\\n');
lines.forEach((line, i) => {
    if (line.includes('WEDDING PRODUCT')) {
        console.log("Line " + i + ": " + line);
        for (let j = i; j < i + 20; j++) {
            console.log("  Line " + j + ": " + lines[j]);
            if (lines[j].includes(']')) break;
        }
    }
});
