/**
 * Coded by Harith
 * Kampungcetak ®
 */
const fs = require('fs');

let content = fs.readFileSync('frontend/src/components/page-sections/shop/product-details.tsx', 'utf8');

// 1. Fix the step variables
const stepVarsOld = `    const step1Options = options.filter(o => /format|size|material/i.test(o.name));
    const step2Options = options.filter(o => !/format|size|material|turnaround/i.test(o.name));
    const step3Options = options.filter(o => /turnaround/i.test(o.name));`;

const stepVarsNew = `    const step1Options = options.filter(o => /format|size|material|package/i.test(o.name));
    const step2Options = options.filter(o => !/format|size|material|package|turnaround|addon/i.test(o.name));
    const step3Addons = options.filter(o => /addon/i.test(o.name));
    const stepTurnaround = options.filter(o => /turnaround/i.test(o.name));`;
content = content.replace(stepVarsOld, stepVarsNew);

// 2. Fix the multi-select input mapping
content = content.replace(
  `                  <input 
                    type="radio" 
                    name={opt.name} 
                    className="w-4 h-4 text-primary focus:ring-primary accent-primary"
                    checked={selectedOptions[opt.name] === idx}
                    onChange={() => handleOptionChange(opt.name, idx)}
                  />`,
  `                  <input 
                    type={opt.isMultiSelect ? "checkbox" : "radio"} 
                    name={opt.name} 
                    className="w-4 h-4 text-primary focus:ring-primary accent-primary"
                    checked={opt.isMultiSelect ? Array.isArray(selectedOptions[opt.name]) && (selectedOptions[opt.name] as number[]).includes(idx) : selectedOptions[opt.name] === idx}
                    onChange={() => handleOptionChange(opt.name, idx, opt.isMultiSelect)}
                  />`
);

content = content.replace(
  `                className={\`flex items-center justify-between p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 \${
                  selectedOptions[opt.name] === idx 
                    ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-sm" 
                    : "border-gray-200 dark:border-border hover:border-primary/50 dark:hover:border-primary/50"
                }\`}`,
  `                className={\`flex items-center justify-between p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 \${
                  (opt.isMultiSelect ? Array.isArray(selectedOptions[opt.name]) && (selectedOptions[opt.name] as number[]).includes(idx) : selectedOptions[opt.name] === idx)
                    ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-sm" 
                    : "border-gray-200 dark:border-border hover:border-primary/50 dark:hover:border-primary/50"
                }\`}`
);

// 3. Fix Step rendering logic
// Turnaround logic is currently bound to step3Options. Let's rename them appropriately!
// Wait, replacing it exactly is hard because it's a huge file.
// Let's replace 'step3Options' with 'stepTurnaround' globally EXCEPT where we just defined it!
content = content.replace(/step3Options/g, 'stepTurnaround');

// Now let's inject step3Addons rendering before the Quantity/Turnaround step!
const step2Rendering = `          {step2Options.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-gray-200 dark:border-border pb-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">3</span>
                <h2 className="text-lg font-bold text-gray-800 dark:text-foreground">Printing & Options</h2>
              </div>
              {renderOptions(step2Options)}
            </div>
          )}`;

// We need to inject Step 3 (Addons) right after Step 2.
// BUT wait, what if Step 2 is empty? The number needs to be dynamic.
const newStep3Addons = `
          {/* STEP 3 (ADDONS) */}
          {step3Addons.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-gray-200 dark:border-border pb-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  {step1Options.length && step2Options.length ? "4" : step1Options.length || step2Options.length ? "3" : "2"}
                </span>
                <h2 className="text-lg font-bold text-gray-800 dark:text-foreground">Addons</h2>
              </div>
              {renderOptions(step3Addons)}
            </div>
          )}
`;

content = content.replace(step2Rendering, step2Rendering + newStep3Addons);

// Step 4 (Quantity) numbering logic:
const quantityHeaderOld = `              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                {step1Options.length && step2Options.length ? "4" : step1Options.length || step2Options.length ? "3" : "2"}
              </span>`;

const quantityHeaderNew = `              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                {[step1Options.length, step2Options.length, step3Addons.length].filter(Boolean).length + 1}
              </span>`;

content = content.replace(quantityHeaderOld, quantityHeaderNew);

fs.writeFileSync('frontend/src/components/page-sections/shop/product-details.tsx', content);
console.log('Rendering fixed!');
