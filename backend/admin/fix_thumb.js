const fs = require('fs');
const tmPath = 'src/components/global/tasks/TaskModal.tsx';
let tm = fs.readFileSync(tmPath, 'utf8');

const target = "const thumbUrl = matchingFile ? `${backendUrl}/api/files/proxy-download?url=${encodeURIComponent(matchingFile.url.startsWith('http') ? matchingFile.url.replace('/media/', '/media/thumbnails/').replace(/\\.[^/.]+$/, '.jpg') : `${backendUrl}/${matchingFile.url.replace(/^\\/+/, '')}`.replace('/media/', '/media/thumbnails/').replace(/\\.[^/.]+$/, '.jpg'))}` : \"\";";

const replacement = `let rawUrl = "";
                                  if (matchingFile) {
                                    rawUrl = matchingFile.url.startsWith('http') ? matchingFile.url : \`\${backendUrl}/\${matchingFile.url.replace(/^\\/+/, '')}\`;
                                  }
                                  const thumbUrl = rawUrl ? \`https://wsrv.nl/?url=\${encodeURIComponent(rawUrl)}&w=200&h=200&fit=cover\` : "";`;

if (tm.includes(target)) {
    tm = tm.replace(target, replacement);
    fs.writeFileSync(tmPath, tm);
    console.log("thumbUrl fixed");
} else {
    console.log("Target not found!");
}
