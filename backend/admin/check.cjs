const fs = require('fs');
const path = require('path');

const lucideDts = fs.readFileSync(path.join(__dirname, 'node_modules/lucide-react/dist/lucide-react.d.ts'), 'utf8');

const availableIcons = new Set();
const exportMatch = lucideDts.match(/export\s+\{([^}]+)\}/);
if (exportMatch) {
  const exportsStr = exportMatch[1];
  const items = exportsStr.split(',').map(s => s.trim());
  for (const item of items) {
    if (!item) continue;
    const parts = item.split(' as ');
    const name = parts.length > 1 ? parts[1] : parts[0];
    availableIcons.add(name);
  }
}

function findImports(dir) {
  let files = fs.readdirSync(dir);
  for (let file of files) {
    let fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findImports(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let regex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        let imports = match[1].split(',').map(i => i.trim());
        for (const imp of imports) {
          if (!imp) continue;
          let name = imp.split(' as ')[0].trim();
          if (name === 'LucideIcon' || name === 'LucideProps' || name === 'createLucideIcon' || name === 'icons') continue;
          if (!availableIcons.has(name)) {
             console.log('MISSING:', name, 'in', fullPath);
          }
        }
      }
    }
  }
}

findImports(path.join(__dirname, 'src'));
