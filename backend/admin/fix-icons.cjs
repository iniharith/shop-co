const fs = require('fs');
const path = require('path');

const map = {
  'AlertCircle': 'CircleAlert',
  'CheckCircle': 'CircleCheck',
  'CheckCircle2': 'CircleCheckBig',
  'XCircle': 'CircleX',
  'Edit': 'Pencil',
  'BadgeIcon': 'Badge',
  'MoreHorizontal': 'Ellipsis',
  'CircuitBoardIcon': 'CircuitBoard',
  'LayoutDashboardIcon': 'LayoutDashboard',
  'LucideShoppingBag': 'ShoppingBag',
  'MoreVertical': 'EllipsisVertical',
  'UserCircle2Icon': 'CircleUserRound',
  'UserX2Icon': 'UserRoundX',
  'CheckIcon': 'Check',
  'ChevronLeftIcon': 'ChevronLeft',
  'ChevronRightIcon': 'ChevronRight',
  'CalendarIcon': 'Calendar',
  'UserIcon': 'User',
  'LinkIcon': 'Link',
  'FileIcon': 'File',
  'UserCircle2': 'CircleUserRound',
  'UploadIcon': 'Upload',
  'BookTemplate': 'BookOpen'
};

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace in imports
  let regex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/g;
  let match;
  while ((match = regex.exec(original)) !== null) {
    let importText = match[1];
    let newImportText = importText;
    for (let key in map) {
       // match exactly word boundaries
       let rx = new RegExp(`\\b${key}\\b`, 'g');
       newImportText = newImportText.replace(rx, map[key]);
    }
    content = content.replace(match[1], newImportText);
  }

  // Replace component usages
  for (let key in map) {
    let rx = new RegExp(`\\b${key}\\b`, 'g');
    content = content.replace(rx, map[key]);
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
