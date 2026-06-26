import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function PageContainer({
  children,
  scrollable = true,
  nativeScroll = false,
}: {
  children: React.ReactNode;
  scrollable?: boolean;
  nativeScroll?: boolean;
}) {
  return (
    <>
      {nativeScroll ? (
        // Native browser scroll — no Radix ScrollArea so child overflow-x-auto is never clipped
        <div
          style={{ height: 'calc(100dvh - 52px)' }}
          className='w-full overflow-y-auto overflow-x-hidden'
        >
          <div className='flex flex-1 p-4 md:px-6 w-full max-w-full min-w-0'>
            {children}
          </div>
        </div>
      ) : scrollable ? (
        <ScrollArea className='h-[calc(100dvh-52px)] w-full max-w-full'>
          <div className='flex flex-1 p-4 md:px-6 w-full max-w-full min-w-0'>{children}</div>
        </ScrollArea>
      ) : (
        <div className='flex flex-1 p-4 md:px-6 w-full max-w-full min-w-0'>{children}</div>
      )}
    </>
  );
}
