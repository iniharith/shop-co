const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\PRINTARA\\.gemini\\antigravity\\brain\\b4b5dc9a-3358-4bf2-abe3-46af1b6f16d4\\.system_generated\\steps\\1889\\content.md', 'utf8');

const lines = content.split('\n');
const startIndex = lines.findIndex(l => l.includes('Tracking Status Request'));
if (startIndex !== -1) {
    console.log(lines.slice(startIndex, startIndex + 50).join('\n'));
}
