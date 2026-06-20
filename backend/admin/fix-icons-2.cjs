const fs = require('fs');
const path = require('path');

const map = {
  'AlertTriangle': 'TriangleAlert',
  'HelpCircle': 'CircleHelp',
  'Loader2': 'LoaderCircle',
  'Twitter': 'Twitter' // wait, we will remove twitter from lucide-react and use something else or just remove it if unused
};

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  let regex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/g;
  let match;
  while ((match = regex.exec(original)) !== null) {
    let importText = match[1];
    let newImportText = importText;
    for (let key in map) {
       let rx = new RegExp(`\\b${key}\\b`, 'g');
       newImportText = newImportText.replace(rx, map[key]);
    }
    // Remove Twitter from lucide-react imports
    newImportText = newImportText.replace(/\bTwitter\b,?\s*/g, '');
    content = content.replace(match[1], newImportText);
  }

  // Replace usages
  for (let key in map) {
    if (key !== 'Twitter') {
      let rx = new RegExp(`\\b${key}\\b`, 'g');
      content = content.replace(rx, map[key]);
    }
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', filePath);
  }
}

function walk(dir) {
  let files = fs.readdirSync(dir);
  for (let file of files) {
    let fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      replaceInFile(fullPath);
    }
  }
}

walk(path.join(__dirname, 'src'));
