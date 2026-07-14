const fs = require('fs');

// Fix artworksManager.tsx
const amPath = 'src/components/global/artworks/artworksManager.tsx';
let am = fs.readFileSync(amPath, 'utf8');

am = am.replace(
  \"if (f.category === 'TASK' && f.taskId) {\",
  \"if ((f.category === 'TASK' || f.category === 'CUSTOMER_UPLOAD') && f.taskId) {\"
);

fs.writeFileSync(amPath, am);

// Fix TaskModal.tsx
const tmPath = 'src/components/global/tasks/TaskModal.tsx';
let tm = fs.readFileSync(tmPath, 'utf8');

// Fix thumbUrl (activity log)
tm = tm.replace(
  \"const thumbUrl = matchingFile ? `${backendUrl}/api/files/proxy-download?url=${encodeURIComponent(matchingFile.url.startsWith('http') ? matchingFile.url.replace('/media/', '/media/thumbnails/').replace(/\\\\.[^/.]+$/, '.jpg') : `${backendUrl}/${matchingFile.url.replace(/^\\\\/+/, '')}`.replace('/media/', '/media/thumbnails/').replace(/\\\\.[^/.]+$/, '.jpg'))}` : \\\"\\\";\",
  `let rawUrl = "";
                                  if (matchingFile) {
                                    rawUrl = matchingFile.url.startsWith('http') ? matchingFile.url : \`\${backendUrl}/\${matchingFile.url.replace(/^\\\\/+/, '')}\`;
                                  }
                                  const thumbUrl = rawUrl ? \`https://wsrv.nl/?url=\${encodeURIComponent(rawUrl)}&w=200&h=200&fit=cover\` : "";`
);

// Fix Artwork Folder Button
tm = tm.replace(
  \"<a href={`/admin/artworks?folder=${encodeURIComponent(task.title || task._id)}`} target=\\\"_blank\\\" className=\\\"flex items-center gap-1.5 px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-md transition-colors\\\" title=\\\"Go to Artwork Folder\\\">\",
  `<a href={\`/admin/artworks?folder=\${encodeURIComponent(task.customerUsername ? ((((usersData as any)?.users || []).find((u: any) => u.username === task.customerUsername || u._id === task.customerUsername || u.email === task.customerUsername))?.name || task.customerUsername) : (task.title || task._id))}\`} target=\"_blank\" className=\"flex items-center gap-1.5 px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-md transition-colors\" title=\"Go to Artwork Folder\">`
);

// Fix Share Link in FileAttachmentCard
if (!tm.includes(\"const { data: allFilesData } = useAllFiles();\")) {
    tm = tm.replace(
      \"const FileAttachmentCard = ({ task, file, deleteFile, isDeletingFile, onPreview, onDeleteLocal }: any) => {\",
      \"const FileAttachmentCard = ({ task, file, deleteFile, isDeletingFile, onPreview, onDeleteLocal }: any) => {\\n  const { data: allFilesData } = useAllFiles();\\n  const allFiles = (allFilesData as any)?.data || [];\"
    );
}

tm = tm.replace(
  \"const cleanShareLink = `${window.location.origin}/share/file/${file._id || file.id}`;\",
  `const realFile = allFiles.find((f: any) => f.path === file.url || (file.url && file.url.includes(f.filename)));
    const realFileId = realFile?._id || realFile?.id || file._id || file.id;

    if (!realFileId) {
       toast.error("Cannot generate share link: File ID not found in database.");
       return;
    }

    const cleanShareLink = \`\${window.location.origin}/share/file/\${realFileId}\`;`
);

// Fix FileAttachmentCard Thumbnail
tm = tm.replace(
  `<Image 
                src={encodedFileUrl} 
                alt=\"thumbnail\" 
                width={60}
                height={60}
                quality={40}
                className=\"w-full h-full object-cover absolute inset-0 z-0\"`,
  `<img 
                src={\`https://wsrv.nl/?url=\${encodeURIComponent(fileUrlStr)}&w=200&h=200&fit=cover\`}
                alt=\"thumbnail\" 
                loading=\"lazy\"
                className=\"w-full h-full object-cover absolute inset-0 z-0\"`
);
tm = tm.replace(
  \"<Image\\n                src={encodedFileUrl}\\n                alt=\\\"thumbnail\\\"\\n                width={60}\\n                height={60}\\n                quality={40}\\n                className=\\\"w-full h-full object-cover absolute inset-0 z-0\\\"\",
  `<img \\n                src={\`https://wsrv.nl/?url=\${encodeURIComponent(fileUrlStr)}&w=200&h=200&fit=cover\`}\\n                alt=\\\"thumbnail\\\" \\n                loading=\\\"lazy\\\"\\n                className=\\\"w-full h-full object-cover absolute inset-0 z-0\\\"`
);

fs.writeFileSync(tmPath, tm);
console.log('Fixes applied.');
