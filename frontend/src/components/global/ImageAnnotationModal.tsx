'use client';

import { useSession } from 'next-auth/react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AnnotatedImage, AnnotationHeader, AnnotationToolbar, useImageAnnotationSession } from './ImageAnnotations';

export function ImageAnnotationModal({ file, onClose }: { file: { _id: string; originalName: string; _annotationEditorId?: string } | null; onClose: () => void }) {
  const { data: auth } = useSession();
  const session = useImageAnnotationSession(file?._id, auth?.user?.token || '', {
    id: (auth?.user as any)?.id || '', name: auth?.user?.name || 'User',
  }, !!file, file?._annotationEditorId);
  const src = `${process.env.NEXT_PUBLIC_BACKEND_URL || ''}/api/files/${file?._id}/preview`;
  return <Dialog open={!!file} onOpenChange={open => { if (!open && session.canLeave()) onClose(); }}>
    <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[95vw] h-[95vh] max-h-[95vh] p-0 bg-black border-none text-white flex flex-col overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 p-3 pr-12 border-b border-white/10">
        <DialogTitle className="text-sm flex-1 truncate min-w-0">{file?.originalName}</DialogTitle>
        <DialogDescription className="sr-only">View and annotate your image. Each editor has a separate layer.</DialogDescription>
        <AnnotationHeader session={session} />
      </div>
      <div className={`flex-1 min-h-0 p-3 relative ${session.editing ? 'pb-28' : ''}`}>
        {file && <AnnotatedImage src={src} alt={file.originalName} session={session} />}
        {session.editing && <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-max max-w-[96%]"><AnnotationToolbar session={session} /></div>}
      </div>
    </DialogContent>
  </Dialog>;
}
