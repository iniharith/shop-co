/**
 * Coded by Harith
 * Kampungcetak ®
 */
const fs = require('fs');

// Fix dummy-products.ts
let dummy = fs.readFileSync('frontend/src/constants/dummy-products.ts', 'utf8');
const lastIndex = dummy.lastIndexOf('"_id": "prod-143"');
if (lastIndex !== -1) {
    dummy = dummy.substring(0, lastIndex) + '"_id": "prod-153"' + dummy.substring(lastIndex + '"_id": "prod-143"'.length);
    fs.writeFileSync('frontend/src/constants/dummy-products.ts', dummy);
    console.log("Fixed dummy-products.ts to use prod-153");
}

// Fix index.ts
let index = fs.readFileSync('frontend/src/constants/index.ts', 'utf8');

// The first occurrence was modified to have PHOTOBOOK with prod-143, let's fix it
index = index.replace(
    \`{ label: "WELCOME BOARD", href: "/home/shop/prod-143" },\\n      { label: "PHOTOBOOK", href: "/home/shop/prod-143" }\`,
    \`{ label: "WELCOME BOARD", href: "/home/shop/prod-143" },\\n      { label: "PHOTOBOOK", href: "/home/shop/prod-153" }\`
);

// The second occurrence needs to have PHOTOBOOK appended with prod-153
// Let's find exactly the second WELCOME BOARD without PHOTOBOOK
index = index.replace(
    \`{ label: "WELCOME BOARD", href: "/home/shop/prod-143" }\\n    ]\\n  },\\n  {\\n    label: "FOOD PACKAGING"\`,
    \`{ label: "WELCOME BOARD", href: "/home/shop/prod-143" },\\n      { label: "PHOTOBOOK", href: "/home/shop/prod-153" }\\n    ]\\n  },\\n  {\\n    label: "FOOD PACKAGING"\`
);

fs.writeFileSync('frontend/src/constants/index.ts', index);
console.log("Fixed index.ts");
