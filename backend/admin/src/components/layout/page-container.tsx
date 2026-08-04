/**
 * Coded by Harith
 * Kampungcetak ®
 */
"use client";

import Lenis from 'lenis';
import { usePathname } from 'next/navigation';
import React, { useCallback, useEffect, useRef } from 'react';

export default function PageContainer({
  children,
  scrollable = true,
  scrollContainerRef,
  smooth = true,
}: {
  children: React.ReactNode;
  scrollable?: boolean;
  scrollContainerRef?: React.Ref<HTMLDivElement>;
  smooth?: boolean;
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();
  const setWrapperRef = useCallback((node: HTMLDivElement | null) => {
    wrapperRef.current = node;
    if (typeof scrollContainerRef === 'function') scrollContainerRef(node);
    else if (scrollContainerRef) (scrollContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
  }, [scrollContainerRef]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const content = contentRef.current;
    if (!scrollable || !smooth || !wrapper || !content) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(pointer: fine)');

    const updateLenis = () => {
      const shouldRun = !reducedMotion.matches && finePointer.matches;
      if (shouldRun && !lenisRef.current) {
        lenisRef.current = new Lenis({
          wrapper,
          content,
          autoRaf: true,
          lerp: 0.12,
          smoothWheel: true,
          syncTouch: false,
          wheelMultiplier: 0.9,
          stopInertiaOnNavigate: true,
          prevent: node => node instanceof HTMLElement && Boolean(node.closest(
            '[data-lenis-prevent], [data-radix-scroll-area-viewport], [role="dialog"], [role="menu"]',
          )),
        });
      } else if (!shouldRun && lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
    };

    updateLenis();
    reducedMotion.addEventListener('change', updateLenis);
    finePointer.addEventListener('change', updateLenis);

    return () => {
      reducedMotion.removeEventListener('change', updateLenis);
      finePointer.removeEventListener('change', updateLenis);
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };
  }, [scrollable, smooth]);

  const previousPathname = useRef(pathname);
  useEffect(() => {
    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname;
      lenisRef.current?.stop();
    }
  }, [pathname]);

  return (
    <>
      {scrollable ? (
        <div ref={setWrapperRef} className='h-[calc(100svh-80px)] w-full max-w-full overflow-y-auto overscroll-contain'>
          <div ref={contentRef} className='flex flex-1 p-4 md:px-6 w-full max-w-full min-w-0'>{children}</div>
        </div>
      ) : (
        <div className='flex flex-1 p-4 md:px-6 w-full max-w-full min-w-0'>{children}</div>
      )}
    </>
  );
}
