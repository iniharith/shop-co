/**
 * Coded by Harith
 * Kampungcetak ®
 */
const fs = require('fs');
let text = fs.readFileSync('frontend/src/components/page-sections/shop/product-details.tsx', 'utf8');

const targetStr = "const options = product.printingOptions || [];";
const insertStr = `const options = product.printingOptions || [];

  let minQuantity = 1;
  if (product.category === 'button-badge') {
    const typeName = options.find(o => o.name.toLowerCase() === 'type')?.name;
    const type = typeName && typeof selectedOptions[typeName] === 'number' ? options.find(o => o.name === typeName)?.options[selectedOptions[typeName] as number]?.label : "";
    if (type === "BUTTON BADGE MAGNET TAG") {
      minQuantity = 10;
    }
  }

  useEffect(() => {
    if (quantity < minQuantity) {
      setQuantity(minQuantity);
    }
  }, [minQuantity, quantity]);
`;

text = text.replace(targetStr, insertStr);

text = text.replace(
  "onDecrement={() => setQuantity((q) => Math.max(1, q - 1))}",
  "onDecrement={() => setQuantity((q) => Math.max(minQuantity, q - 1))}"
);

fs.writeFileSync('frontend/src/components/page-sections/shop/product-details.tsx', text);
console.log('Successfully updated product-details.tsx for button badge minimum quantity logic');
