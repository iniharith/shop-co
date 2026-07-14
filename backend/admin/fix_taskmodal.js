const fs = require('fs');
const path = 'src/components/global/tasks/TaskModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix FileAttachmentCard props to accept allFiles
content = content.replace(
  "const FileAttachmentCard = ({ task, file, deleteFile, isDeletingFile, onPreview, onDeleteLocal }: any) => {",
  "const FileAttachmentCard = ({ task, file, deleteFile, isDeletingFile, onPreview, onDeleteLocal, allFiles }: any) => {"
);

// 2. Fix the Share Link inside FileAttachmentCard
content = content.replace(
  "const cleanShareLink = `${window.location.origin}/share/file/${file._id || file.id}`;",
  `const realFile = allFiles?.find((f: any) => f.path === file.url || (file.url && file.url.includes(f.filename)));
    const realFileId = realFile?._id || realFile?.id || file._id || file.id;
    if (!realFileId) {
       toast.error("Cannot generate share link: File ID not found in database.");
       return;
    }
    const cleanShareLink = \`\${window.location.origin}/share/file/\${realFileId}\`;`
);

// 3. Fix the Thumbnail in FileAttachmentCard
const thumbReplace = `<img 
                src={\`https://wsrv.nl/?url=\${encodeURIComponent(fileUrlStr)}&w=200&h=200&fit=cover\`}
                alt="thumbnail" 
                loading="lazy"
                className="w-full h-full object-cover absolute inset-0 z-0" 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const nextEl = e.currentTarget.nextElementSibling;
                  if (nextEl) (nextEl as HTMLElement).style.display = 'flex';
                }}
              />`;

content = content.replace(/<Image[\s\S]*?className="w-full h-full object-cover absolute inset-0 z-0"[\s\S]*?\/>/, thumbReplace);

// 4. Pass allFiles to FileAttachmentCard instances
content = content.replace(
    /<FileAttachmentCard\s+key/g, 
    '<FileAttachmentCard allFiles={allFiles} key'
);

// 5. Fix the activity log thumbnail
const actLogThumbTarget = "const thumbUrl = matchingFile ? `${backendUrl}/api/files/proxy-download?url=${encodeURIComponent(matchingFile.url.startsWith('http') ? matchingFile.url.replace('/media/', '/media/thumbnails/').replace(/\\.[^/.]+$/, '.jpg') : `${backendUrl}/${matchingFile.url.replace(/^\\/+/, '')}`.replace('/media/', '/media/thumbnails/').replace(/\\.[^/.]+$/, '.jpg'))}` : \"\";";
const actLogThumbReplace = `let rawUrl = "";
                                  if (matchingFile) {
                                    rawUrl = matchingFile.url.startsWith('http') ? matchingFile.url : \`\${backendUrl}/\${matchingFile.url.replace(/^\\/+/, '')}\`;
                                  }
                                  const thumbUrl = rawUrl ? \`https://wsrv.nl/?url=\${encodeURIComponent(rawUrl)}&w=200&h=200&fit=cover\` : "";`;

content = content.replace(actLogThumbTarget, actLogThumbReplace);

// 6. Fix encoding garbage from Harith's commit
content = content.replace(/Ô£ª/g, '✦').replace(/ÔÇó/g, '•').replace(/Kampungcetak ┬«/g, 'Kampungcetak ®');

fs.writeFileSync(path, content);
console.log("TaskModal fixed successfully!");
