/**
 * Coded by Harith
 * Kampungcetak ®
 */

const fs = require('fs');
const path = require('path');
const lucide = require('lucide-react');

function findImports(dir) {
  let files = fs.readdirSync(dir);
  for (let file of files) {
    let fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findImports(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let matches = content.match(/import\s+{([^}]+)}\s+from\s+['\"lucide-react['\"]/g);
      if (matches) {
        matches.forEach(m => {
          let imports = m.replace(/import\s+{/, '').replace(/}\s+from.*/, '').split(',').map(i => i.trim());
          imports.forEach(imp => {
            let name = imp.split(' as ')[0].trim();
            if (name && !lucide[name] && name !== 'LucideIcon' && name !== 'LucideProps' && name !== 'createLucideIcon' && name !== 'icons') {
              console.log('Missing: ' + name + ' in ' + fullPath);
            }
          });
        });
      }
    }
  }
}
findImports(path.join(process.cwd(), 'src'));

