/**
 * Coded by Harith
 * Kampungcetak ®
 */
const fs = require('fs');

let content = fs.readFileSync('frontend/src/components/page-sections/shop/product-details.tsx', 'utf8');

// Fix `const defaults: Record<string, number> = {};`
content = content.replace(
  `const defaults: Record<string, number> = {};`,
  `const defaults: Record<string, number | number[]> = {};`
);

// Fix the loop at 120-136
content = content.replace(
  `        const selectedIdx = selectedOptions[opt.name];
        if (selectedIdx !== undefined && opt.options[selectedIdx]) {
          optionAddons += opt.options[selectedIdx].priceAdd;
        }`,
  `        const selectedVal = selectedOptions[opt.name];
        if (Array.isArray(selectedVal)) {
          selectedVal.forEach(idx => {
            if (opt.options[idx]) optionAddons += opt.options[idx].priceAdd;
          });
        } else if (selectedVal !== undefined && opt.options[selectedVal as number]) {
          optionAddons += opt.options[selectedVal as number].priceAdd;
        }`
);

// Fix the loop at 290-300
content = content.replace(
  `                const selectedIdx = selectedOptions[opt.name];
                if (selectedIdx !== undefined && opt.options[selectedIdx]) {
                  optionAddonsWithoutTurnaround += opt.options[selectedIdx].priceAdd;
                }`,
  `                const selectedVal = selectedOptions[opt.name];
                if (Array.isArray(selectedVal)) {
                  selectedVal.forEach(idx => {
                    if (opt.options[idx]) optionAddonsWithoutTurnaround += opt.options[idx].priceAdd;
                  });
                } else if (selectedVal !== undefined && opt.options[selectedVal as number]) {
                  optionAddonsWithoutTurnaround += opt.options[selectedVal as number].priceAdd;
                }`
);

fs.writeFileSync('frontend/src/components/page-sections/shop/product-details.tsx', content);
console.log('Fixed typings!');
