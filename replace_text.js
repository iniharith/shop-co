/**
 * Coded by Harith
 * Kampungcetak ®
 */
const fs = require('fs');
const path = require('path');

const replacements = [
  {
    file: 'backend/admin/src/components/global/artworks/artworksManager.tsx',
    find: /"CORPORATE GIFT"/g,
    replace: '"PREMIUM GIFT"'
  },
  {
    file: 'backend/admin/src/components/global/production/productionManager.tsx',
    find: /"CORPORATE GIFT"/g,
    replace: '"PREMIUM GIFT"'
  },
  {
    file: 'backend/admin/src/components/global/tasks/TaskModal.tsx',
    find: /"CORPORATE GIFT"/g,
    replace: '"PREMIUM GIFT"'
  },
  {
    file: 'backend/admin/src/components/global/tasks/TaskModal.tsx',
    find: />Corporate Gift</g,
    replace: '>Premium Gift<'
  },
  {
    file: 'backend/admin/src/components/global/tasks/tasksManager.tsx',
    find: /"CORPORATE GIFT"/g,
    replace: '"PREMIUM GIFT"'
  },
  {
    file: 'backend/admin/src/components/global/tasks/tasksManager.tsx',
    find: />Corporate Gift</g,
    replace: '>Premium Gift<'
  },
  {
    file: 'frontend/src/components/page-sections/home/categorys.tsx',
    find: /"CORPORATE GIFT":/g,
    replace: '"PREMIUM GIFT":'
  },
  {
    file: 'frontend/src/components/page-sections/shop/filterSidbar.tsx',
    find: /"Corporate Gift"/g,
    replace: '"Premium Gift"'
  },
  {
    file: 'frontend/src/constants/index.ts',
    find: /label: "CORPORATE GIFT"/g,
    replace: 'label: "PREMIUM GIFT"'
  },
  {
    file: 'frontend/src/constants/index.ts',
    find: /label: "CALANDER"/g,
    replace: 'label: "CALENDAR"' // Wait! User asked to change to CALENDER, not CALENDAR!
  }
];

replacements.forEach(({ file, find, replace }) => {
  const filepath = path.join(__dirname, file);
  if (fs.existsSync(filepath)) {
    let content = fs.readFileSync(filepath, 'utf8');
    content = content.replace(find, replace);
    fs.writeFileSync(filepath, content);
    console.log("Updated " + file);
  } else {
    console.log("File not found: " + file);
  }
});
