/**
 * Coded by Harith
 * Kampungcetak ®
 */
const fs = require('fs');
const data = require('./display_items_data');

let content = fs.readFileSync('frontend/src/constants/dummy-products.ts', 'utf8');

// Replace existing products
const idsToReplace = ['prod-106', 'prod-107', 'prod-108'];
for (const id of idsToReplace) {
  const replacementStr = JSON.stringify(data[id], null, 2);
  
  // Find the exact object in the file
  const startRegex = new RegExp(`{\\s*_id:\\s*"${id}"[\\s\\S]*?images: \\[\\[.*?\\|.*?\\]\\],[\\s\\S]*?sizes: \\[.*?\\]`);
  
  // Actually, since I can't easily parse out a JS object with regex safely if it has nested arrays and objects,
  // let's use a simpler way: just replace from _id: "prod-..." to the next },
  // Oh wait, printingOptions has nested },
  
  // Instead of replacing in-place with regex, let's just append the new items at the end, and just remove the old items!
}

// But removing old items with Regex is also tricky.
// Better way: read the file lines, track bracket nesting.

function replaceOrAppendProducts(filePath, newData) {
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  let outputLines = [];
  
  let inTargetObject = false;
  let targetId = null;
  let braceCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if we are starting a product object
    const idMatch = line.match(/_id:\s*"([^"]+)"/);
    if (!inTargetObject && idMatch && newData[idMatch[1]] && ['prod-106', 'prod-107', 'prod-108'].includes(idMatch[1])) {
      inTargetObject = true;
      targetId = idMatch[1];
      // Note: we don't output this line
      
      // We need to output the new object here
      const newObjStr = JSON.stringify(newData[targetId], null, 4);
      // Remove outer braces since the array structure handles it? No, JSON.stringify outputs full object.
      // But wait, the file has `{ \n _id: "prod-106", ... }`
      // We should inject it without the outer braces to match existing formatting, or just inject it directly since it's an object in an array.
      
      // Wait! The line with `_id: "prod-106"` is NOT the start of the object. The line BEFORE it was `{` !
      // Let's modify the array of objects properly.
    }
    
    if (inTargetObject) {
      if (line.includes('{')) braceCount += (line.match(/{/g) || []).length;
      if (line.includes('}')) braceCount -= (line.match(/}/g) || []).length;
      
      // When we hit -1 braceCount relative to the start (because the `{` before `_id` started it)
      // Actually, if we just find the `{` before the `_id`, it's easier.
    }
  }
}
