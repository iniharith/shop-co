const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\PRINTARA\\.gemini\\antigravity\\brain\\b4b5dc9a-3358-4bf2-abe3-46af1b6f16d4\\.system_generated\\steps\\1889\\content.md', 'utf8');

// Regex to find endpoints like POST https://api.easyparcel.com/... or GET ...
const endpointRegex = /(?:POST|GET)\s+https?:\/\/api\.easyparcel\.com\/[^\s<]+/gi;
const matches = [...new Set(content.match(endpointRegex))];

console.log("Found endpoints:");
matches.forEach(m => console.log(m));
