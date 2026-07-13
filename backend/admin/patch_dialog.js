const fs = require('fs');
const path = require('path');

function addDialogDescription(directory) {
    const files = fs.readdirSync(directory);
    
    for (const file of files) {
        const filepath = path.join(directory, file);
        const stat = fs.statSync(filepath);
        
        if (stat.isDirectory()) {
            addDialogDescription(filepath);
        } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
            let content = fs.readFileSync(filepath, 'utf-8');
            let modified = false;

            if (content.includes('<DialogTitle') && !content.includes('<DialogDescription')) {
                if (content.includes('DialogTitle') && !content.includes('DialogDescription')) {
                    content = content.replace(/DialogTitle(,\s*|\s*\}|\})/g, 'DialogTitle, DialogDescription$1');
                }
                
                content = content.replace(
                    /(<\/DialogTitle>)/g,
                    '$1\n                <DialogDescription className="sr-only">Dialog Content</DialogDescription>'
                );
                
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(filepath, content, 'utf-8');
                console.log(`Patched ${filepath}`);
            }
        }
    }
}

addDialogDescription(path.join(__dirname, 'src', 'components'));
