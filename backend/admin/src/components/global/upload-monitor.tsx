"use client";
import React from 'react';
import { CloudUpload, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { useUploadStore } from '@/store/uploadStore';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Progress } from '../ui/progress';
import { uploadTaskFile } from '@/api/tasks';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

export default function UploadMonitor() {
  const { data: session } = useSession();
  const { uploads, removeUpload, clearCompleted, updateStatus, updateProgress, addUpload } = useUploadStore();
  const uploadList = Object.values(uploads).sort((a, b) => b.createdAt - a.createdAt);
  
  const activeCount = uploadList.filter(u => u.status === 'uploading').length;
  const errorCount = uploadList.filter(u => u.status === 'error').length;
  const totalCount = uploadList.length;

  const handleRetry = async (upload: any) => {
    if (!upload.file || !upload.taskId) return;
    const token = (session?.user as any)?.token;
    if (!token) return;

    // Reset upload status to uploading
    updateStatus(upload.id, 'uploading', undefined);
    updateProgress(upload.id, 0);

    // Create a new abort controller
    const abortController = new AbortController();
    
    // We update the store with the new abort controller via a workaround or just let addUpload override it
    // Wait, addUpload overrides everything. Let's just remove and re-add to be clean
    removeUpload(upload.id);
    addUpload({
      id: upload.id,
      name: upload.name,
      taskId: upload.taskId,
      tag: upload.tag,
      file: upload.file,
      abortController
    });

    try {
      await uploadTaskFile(token, upload.taskId, upload.file, upload.tag, (percent) => {
        updateProgress(upload.id, percent);
      }, abortController);
      updateStatus(upload.id, 'success');
      toast.success(`Retry successful: ${upload.name}`);
    } catch (err: any) {
      if (err.message !== "Upload cancelled") {
        updateStatus(upload.id, 'error', err.message || "Failed to upload file");
        toast.error(`Retry failed: ${upload.name}`);
      }
    }
  };

  if (totalCount === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="relative cursor-pointer mx-2 flex items-center justify-center">
          <CloudUpload className={`h-5 w-5 ${errorCount > 0 ? 'text-red-500' : activeCount > 0 ? 'text-blue-500 animate-pulse' : 'text-gray-600 dark:text-gray-300'}`} />
          {(activeCount > 0 || errorCount > 0) && (
            <Badge className={`absolute -top-2 -right-2 ${errorCount > 0 ? 'bg-red-500' : 'bg-blue-500'} text-white text-[10px] w-4 h-4 p-0 flex items-center justify-center rounded-full`}>
              {errorCount > 0 ? errorCount : activeCount}
            </Badge>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 shadow-lg border border-border/50 bg-background/95 backdrop-blur-md">
        <div className="p-3 border-b border-border/50 flex justify-between items-center bg-muted/30">
          <h3 className="font-semibold text-sm">Uploads</h3>
          {uploadList.some(u => u.status === 'success') && (
            <button onClick={clearCompleted} className="text-[10px] text-muted-foreground hover:text-foreground hover:underline transition-colors">
              Clear Completed
            </button>
          )}
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2 space-y-2">
          {uploadList.map((upload) => (
            <div key={upload.id} className="relative bg-card border border-border/50 rounded-lg p-3 shadow-sm flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  {upload.status === 'uploading' && <CloudUpload className="w-4 h-4 text-blue-500 animate-pulse shrink-0" />}
                  {upload.status === 'success' && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                  {upload.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />}
                  <span className="text-xs font-medium truncate" title={upload.name}>{upload.name}</span>
                </div>
                <button 
                  onClick={() => removeUpload(upload.id)} 
                  className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                  title={upload.status === 'uploading' ? 'Cancel Upload' : 'Dismiss'}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {upload.status === 'uploading' && (
                <div className="flex items-center gap-2">
                  <Progress value={upload.progress} className="h-1.5 flex-1" />
                  <span className="text-[10px] text-muted-foreground font-medium w-8 text-right">{upload.progress}%</span>
                </div>
              )}

              {upload.status === 'error' && (
                <div className="flex items-center gap-2">
                  <p className="flex-1 text-[10px] text-red-500 font-medium bg-red-500/10 p-1.5 rounded truncate" title={upload.errorMessage}>
                    {upload.errorMessage || 'Upload failed'}
                  </p>
                  {upload.file && upload.taskId && (
                    <button 
                      onClick={() => handleRetry(upload)}
                      className="text-[10px] font-medium px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-white transition-colors"
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
