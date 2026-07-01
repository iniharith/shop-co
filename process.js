/**
 * Coded by Harith
 * Kampungcetak ®
 */
const fs = require('fs');
const content = fs.readFileSync('C:/Users/PRINTARA/.gemini/antigravity/brain/7e22e2c0-be22-4b85-9bf0-0805ed48b18d/.system_generated/steps/1092/content.md', 'utf8');
const lines = content.split('\n');
const termsHtml = lines.slice(992, 1205).join('\n');
let modified = termsHtml.replace(/Gogoprint/g, 'Kampung Cetak');
modified = modified.replace(/gogoprint/g, 'kampungcetak');
modified = modified.replace(/class="table-content" data-name="[^"]*"/g, 'className="text-xl font-bold mt-6 mb-2"');
modified = modified.replace(/<h2/g, '<h2 className="text-2xl font-bold mt-8 mb-4"');
modified = modified.replace(/<p>/g, '<p className="mb-4 text-gray-700 dark:text-gray-300">');
modified = modified.replace(/<ul>/g, '<ul className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300">');
// Remove Data protection section
modified = modified.replace(/<h3 className="text-xl font-bold mt-6 mb-2">DATA PROTECTION<\/h3>[\s\S]*?(<\/ul>|<\/p>)/g, '');
modified = modified.replace(/class="[^"]*"/g, ''); // Remove other classes just in case

const pageCode = `import React from 'react';

const TermsPage = () => {
  return (
    <div className="min-h-screen py-12 bg-gray-50 dark:bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white dark:bg-card p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-border">
        <div dangerouslySetInnerHTML={{ __html: \`${modified.replace(/`/g, '\\`')}\` }} />
      </div>
    </div>
  );
};

export default TermsPage;
`;

fs.mkdirSync('C:/Users/PRINTARA/Documents/GitHub/shop-co/frontend/src/app/terms', { recursive: true });
fs.writeFileSync('C:/Users/PRINTARA/Documents/GitHub/shop-co/frontend/src/app/terms/page.tsx', pageCode);
console.log('Done!');
