/**
 * Coded by Harith
 * Kampungcetak ®
 */
const fs = require('fs');

let content = fs.readFileSync('frontend/src/components/page-sections/shop/product-details.tsx', 'utf8');

// 1. Change selectedOptions state type
content = content.replace(
  `const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});`,
  `const [selectedOptions, setSelectedOptions] = useState<Record<string, number | number[]>>({});`
);

// 2. Change useEffect default setup
content = content.replace(
  `defaults[opt.name] = 0;`,
  `defaults[opt.name] = opt.isMultiSelect ? [] : 0;`
);

// 3. Change handleOptionChange
const oldHandleOptionChange = `  const handleOptionChange = (optionName: string, index: number) => {
    setSelectedOptions(prev => ({ ...prev, [optionName]: index }));
  };`;

const newHandleOptionChange = `  const handleOptionChange = (optionName: string, index: number, isMultiSelect?: boolean) => {
    setSelectedOptions(prev => {
      if (isMultiSelect) {
        const current = Array.isArray(prev[optionName]) ? (prev[optionName] as number[]) : [];
        if (current.includes(index)) {
          return { ...prev, [optionName]: current.filter(i => i !== index) };
        } else {
          return { ...prev, [optionName]: [...current, index] };
        }
      }
      return { ...prev, [optionName]: index };
    });
  };`;
content = content.replace(oldHandleOptionChange, newHandleOptionChange);

// 4. Update optionAddons calculation
// This appears twice: once in main logic, once in the turnaround matrix logic
const oldOptionAddonsLoop = `        product.printingOptions.forEach(opt => {
          const selectedIdx = selectedOptions[opt.name];
          if (selectedIdx !== undefined && opt.options[selectedIdx]) {
            optionAddons += opt.options[selectedIdx].priceAdd;
          }
        });`;

const newOptionAddonsLoop = `        product.printingOptions.forEach(opt => {
          const selectedVal = selectedOptions[opt.name];
          if (Array.isArray(selectedVal)) {
            selectedVal.forEach(idx => {
              if (opt.options[idx]) optionAddons += opt.options[idx].priceAdd;
            });
          } else if (selectedVal !== undefined && opt.options[selectedVal]) {
            optionAddons += opt.options[selectedVal].priceAdd;
          }
        });`;
content = content.replace(oldOptionAddonsLoop, newOptionAddonsLoop);

const oldOptionAddonsWithoutLoop = `              if (product.printingOptions) {
                product.printingOptions.forEach(opt => {
                  if (opt.name === turnaroundOpt.name) return;
                  const selectedIdx = selectedOptions[opt.name];
                  if (selectedIdx !== undefined && opt.options[selectedIdx]) {
                    optionAddonsWithoutTurnaround += opt.options[selectedIdx].priceAdd;
                  }
                });
              }`;

const newOptionAddonsWithoutLoop = `              if (product.printingOptions) {
                product.printingOptions.forEach(opt => {
                  if (opt.name === turnaroundOpt.name) return;
                  const selectedVal = selectedOptions[opt.name];
                  if (Array.isArray(selectedVal)) {
                    selectedVal.forEach(idx => {
                      if (opt.options[idx]) optionAddonsWithoutTurnaround += opt.options[idx].priceAdd;
                    });
                  } else if (selectedVal !== undefined && opt.options[selectedVal]) {
                    optionAddonsWithoutTurnaround += opt.options[selectedVal].priceAdd;
                  }
                });
              }`;
content = content.replace(oldOptionAddonsWithoutLoop, newOptionAddonsWithoutLoop);

// 5. Update renderOptions
const oldRenderOptionsStart = `    const renderOptions = (opts: typeof options) => {
      return opts.map((opt, i) => (
        <div key={i} className="space-y-3">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">{opt.name}</label>
          <div className="grid grid-cols-1 gap-2">
            {opt.options.map((val, idx) => (`;

const oldRenderOptionsBody = `              <label 
                key={idx}
                className={\`flex items-center justify-between p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 \${
                  selectedOptions[opt.name] === idx 
                    ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-sm" 
                    : "border-gray-200 dark:border-border hover:border-primary/50 dark:hover:border-primary/50"
                }\`}
              >
                <div className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    name={opt.name} 
                    className="w-4 h-4 text-primary focus:ring-primary accent-primary"
                    checked={selectedOptions[opt.name] === idx}
                    onChange={() => handleOptionChange(opt.name, idx)}
                  />`;

const newRenderOptionsBody = `              <label 
                key={idx}
                className={\`flex items-center justify-between p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 \${
                  (opt.isMultiSelect ? Array.isArray(selectedOptions[opt.name]) && (selectedOptions[opt.name] as number[]).includes(idx) : selectedOptions[opt.name] === idx)
                    ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-sm" 
                    : "border-gray-200 dark:border-border hover:border-primary/50 dark:hover:border-primary/50"
                }\`}
              >
                <div className="flex items-center gap-3">
                  <input 
                    type={opt.isMultiSelect ? "checkbox" : "radio"} 
                    name={opt.name} 
                    className="w-4 h-4 text-primary focus:ring-primary accent-primary"
                    checked={opt.isMultiSelect ? Array.isArray(selectedOptions[opt.name]) && (selectedOptions[opt.name] as number[]).includes(idx) : selectedOptions[opt.name] === idx}
                    onChange={() => handleOptionChange(opt.name, idx, opt.isMultiSelect)}
                  />`;

content = content.replace(oldRenderOptionsBody, newRenderOptionsBody);

// 6. Fix matrix material/lamination accessing
// In handleAddToCart:
const oldMaterialAcc1 = `const selectedMaterial = materialOptName && selectedOptions[materialOptName] !== undefined 
      ? options.find(o => o.name === materialOptName)?.options[selectedOptions[materialOptName]]?.label 
      : "";`;
// This is actually multiline in the file, so I'll use regex.
content = content.replace(
  /const selectedMaterial = materialOptName && selectedOptions\[materialOptName\] !== undefined \n\s+\? options\.find\(o => o\.name === materialOptName\)\?\.options\[selectedOptions\[materialOptName\]\]\?\.label \n\s+: "";/g,
  `const selectedMaterial = materialOptName && typeof selectedOptions[materialOptName] === 'number' 
      ? options.find(o => o.name === materialOptName)?.options[selectedOptions[materialOptName] as number]?.label 
      : "";`
);

content = content.replace(
  /const selectedLamination = laminationOptName && selectedOptions\[laminationOptName\] !== undefined \n\s+\? options\.find\(o => o\.name === laminationOptName\)\?\.options\[selectedOptions\[laminationOptName\]\]\?\.label \n\s+: "";/g,
  `const selectedLamination = laminationOptName && typeof selectedOptions[laminationOptName] === 'number' 
      ? options.find(o => o.name === laminationOptName)?.options[selectedOptions[laminationOptName] as number]?.label 
      : "";`
);

fs.writeFileSync('frontend/src/components/page-sections/shop/product-details.tsx', content);
console.log('product-details.tsx patched');
