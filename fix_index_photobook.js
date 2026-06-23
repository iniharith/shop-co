const fs = require('fs');

let content = fs.readFileSync('frontend/src/constants/index.ts', 'utf8');

const target = `{ label: "WELCOME BOARD", href: "/home/shop/prod-143" }`;
const replacement = `{ label: "WELCOME BOARD", href: "/home/shop/prod-143" },
      { label: "PHOTOBOOK", href: "/home/shop/prod-143" }`;

// Because one was already replaced, we might just replace globally and it will replace the first one that wasn't touched yet.
// Wait! `prod-143` is Welcome Board AND Photobook?
// Ah! Welcome Board was prod-141. Wait, let me check.
