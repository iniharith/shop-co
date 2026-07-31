/**
 * Coded by Harith
 * Kampungcetak ®
 */
import React from 'react';

export default function PageContainer({
  children,
  scrollable = true
}: {
  children: React.ReactNode;
  scrollable?: boolean;
}) {
  return (
    <>
      {scrollable ? (
        <div className='h-[calc(100svh-80px)] w-full max-w-full overflow-y-auto overscroll-contain'>
          <div className='flex flex-1 p-4 md:px-6 w-full max-w-full min-w-0'>{children}</div>
        </div>
      ) : (
        <div className='flex flex-1 p-4 md:px-6 w-full max-w-full min-w-0'>{children}</div>
      )}
    </>
  );
}
