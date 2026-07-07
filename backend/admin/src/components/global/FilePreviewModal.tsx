import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { getFileUrl } from '@/lib/utils';
import { X, ExternalLink, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const FilePreviewModal = ({ 
  isOpen, 
  onClose, 
  file 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  file: any | null; 
}) => {
  if (!file) return null;

  const isImage = file.mimetype?.includes("image") || (file.originalName && file.originalName.match(/\.(jpg|jpeg|png|gif|webp|heic)$/i));
  const isPdf = file.mimetype?.includes("pdf") || (file.originalName && file.originalName.toLowerCase().endsWith(".pdf"));

  const fileUrl = getFileUrl(file.path);
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
  const proxyUrl = `${backendUrl}/api/files/proxy-download?url=${encodeURIComponent(fileUrl)}&name=${encodeURIComponent(file.originalName || "file")}&inline=true#toolbar=0`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] w-full max-h-[95vh] h-full flex flex-col p-0 overflow-hidden bg-black/95 border-none shadow-2xl z-[100]">
        <div className="flex items-center justify-between p-3 bg-black/60 text-white z-10 absolute top-0 left-0 right-0 backdrop-blur-sm">
          <DialogTitle className="text-sm font-medium truncate pr-4 max-w-[70%]">{file.originalName}</DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8" onClick={() => window.open(fileUrl, "_blank")} title="Open in new tab">
              <ExternalLink className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8" onClick={() => {
              const link = document.createElement('a');
              link.href = fileUrl;
              link.download = file.originalName;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }} title="Download">
              <Download className="w-4 h-4" />
            </Button>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-red-500/80 h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </DialogClose>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-2 pt-14 pb-4 overflow-hidden relative">
          {isImage ? (
            <img 
              src={fileUrl} 
              alt={file.originalName} 
              className="max-w-full max-h-full object-contain rounded-md"
            />
          ) : isPdf ? (
            <iframe 
              src={proxyUrl} 
              className="w-full h-full border-none bg-white rounded-md"
              title={file.originalName}
            />
          ) : (
            <div className="text-white flex flex-col items-center bg-zinc-900 p-8 rounded-xl border border-zinc-700">
              <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                <Download className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="mb-2 font-medium text-lg">No preview available</p>
              <p className="mb-6 text-zinc-400 text-sm">This file type cannot be previewed in the browser.</p>
              <Button onClick={() => window.open(fileUrl, "_blank")} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Download File
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
