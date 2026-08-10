import React, { useEffect, useCallback, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { X, ExternalLink, Download, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useUpdateFileTag } from "@/hooks/useAdminDashboard";
import { toast } from "sonner";

const FILE_TAGS = [
  { value: 'attachment', label: 'Attachment', dot: 'bg-gray-500' },
  { value: 'draft', label: 'Draft', dot: 'bg-orange-500' },
  { value: 'for_print', label: 'For Print', dot: 'bg-green-500' },
  { value: 'awb', label: 'AWB', dot: 'bg-red-500' },
];

export const FilePreviewModal = ({ 
  isOpen, 
  onClose, 
  file,
  files = [],
  onNavigate
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  file: any | null;
  files?: any[];
  onNavigate?: (file: any) => void;
}) => {
  const { mutate: updateFileTagMutate, isPending: isUpdatingTag } = useUpdateFileTag();
  const [currentTag, setCurrentTag] = useState<string | null>(null);

  useEffect(() => {
    setCurrentTag(file?.tag || null);
  }, [file]);

  const currentIndex = files.findIndex(f => f._id === file?._id);
  const hasNext = currentIndex >= 0 && currentIndex < files.length - 1;
  const hasPrev = currentIndex > 0;

  const handleNext = useCallback(() => {
    if (hasNext && onNavigate) {
      onNavigate(files[currentIndex + 1]);
    }
  }, [hasNext, currentIndex, files, onNavigate]);

  const handlePrev = useCallback(() => {
    if (hasPrev && onNavigate) {
      onNavigate(files[currentIndex - 1]);
    }
  }, [hasPrev, currentIndex, files, onNavigate]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev]);

  if (!file) return null;

  const getFileUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith('http')) return path;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    return `${backendUrl}/${path}`;
  };

  const fileName = file.originalName || file.name || "";
  const isImage = file.mimetype?.includes("image") || fileName.match(/\.(jpg|jpeg|png|gif|webp|heic)$/i);
  const isPdf = file.mimetype?.includes("pdf") || fileName.toLowerCase().endsWith(".pdf");

  const fileUrl = getFileUrl(file.path || file.url);
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
  const proxyUrl = `${backendUrl}/api/files/proxy-download?url=${encodeURIComponent(fileUrl)}&name=${encodeURIComponent(fileName)}&inline=true#toolbar=0`;

  const activeTag = FILE_TAGS.find(t => t.value === (currentTag || file?.tag)) || FILE_TAGS[0];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] w-full max-h-[95vh] h-full flex flex-col p-0 overflow-hidden bg-black/95 border-none shadow-2xl z-[100]">
        <div className="flex items-center justify-between p-3 bg-black/60 text-white z-10 absolute top-0 left-0 right-0 backdrop-blur-sm">
          <DialogTitle className="text-sm font-medium truncate pr-4 max-w-[70%]">
            {fileName} {files.length > 1 && currentIndex >= 0 && <span className="text-gray-400 ml-2">({currentIndex + 1} of {files.length})</span>}
          </DialogTitle>
                <DialogDescription className="sr-only">Dialog Content</DialogDescription>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8" onClick={() => window.open(fileUrl, "_blank")} title="Open in new tab">
              <ExternalLink className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8" onClick={() => {
              const link = document.createElement('a');
              link.href = fileUrl;
              link.download = fileName;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }} title="Download">
              <Download className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 h-8 gap-1.5" disabled={isUpdatingTag} title="Change file tag">
                  <span className={`w-2 h-2 rounded-full ${activeTag.dot}`} />
                  <span className="text-xs">{activeTag.label}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-700 text-white min-w-40">
                <DropdownMenuLabel className="text-zinc-400 text-xs">File Tag</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-700" />
                {FILE_TAGS.map(t => (
                  <DropdownMenuItem key={t.value} className="gap-2 cursor-pointer" onClick={() => {
                    setCurrentTag(t.value);
                    updateFileTagMutate({ id: file._id, tag: t.value }, {
                      onSuccess: () => toast.success(`Tag changed to ${t.label}`),
                      onError: () => { toast.error("Failed to update tag"); setCurrentTag(file?.tag || null); },
                    });
                  }}>
                    <span className={`w-2 h-2 rounded-full ${t.dot}`} />
                    <span className="flex-1">{t.label}</span>
                    {(currentTag || file?.tag) === t.value && <Check className="w-3.5 h-3.5" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-red-500/80 h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </DialogClose>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-2 pt-14 pb-4 overflow-hidden relative group">
          {hasPrev && (
            <button 
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-all z-20 backdrop-blur-sm border border-white/10"
            >
              <ChevronLeft size={32} />
            </button>
          )}

          {isImage ? (
            <img 
              src={proxyUrl} 
              alt={fileName} 
              className="max-w-full max-h-full object-contain rounded-md select-none"
            />
          ) : isPdf ? (
            <iframe 
              src={proxyUrl} 
              className="w-full h-full border-none bg-white rounded-md"
              title={fileName}
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

          {hasNext && (
            <button 
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-all z-20 backdrop-blur-sm border border-white/10"
            >
              <ChevronRight size={32} />
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
