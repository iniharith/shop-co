const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, '../src/app/(app)');
const files = fs.readdirSync(appDir);

files.forEach(file => {
    if (file.endsWith('.tsx')) {
        const filePath = path.join(appDir, file);
        let content = fs.readFileSync(filePath, 'utf8');

        if (content.includes('LinearGradient') && content.includes('expo-linear-gradient')) {
            if (!content.includes('AppBackground')) {
                content = content.replace(
                    /(import\s+\{[^}]*\}\s+from\s+['"]expo-linear-gradient['"];?\n?)/g,
                    "$1import AppBackground from '../../components/AppBackground';\n"
                );
            }

            content = content.replace(
                /<LinearGradient\s+colors=\{\[colors\.gradientStart,\s*colors\.gradientEnd,\s*colors\.gradientStart\]\}/g,
                "<AppBackground"
            );
            
            // For profile.tsx loading state or others
            content = content.replace(
                /<LinearGradient\s+colors=\{\[colors\.gradientStart,\s*colors\.gradientEnd\]\}/g,
                "<AppBackground"
            );
            
            content = content.replace(/<\/LinearGradient>/g, "</AppBackground>");

            fs.writeFileSync(filePath, content, 'utf8');
        }
    }
});

console.log("Done replacing LinearGradient.");
