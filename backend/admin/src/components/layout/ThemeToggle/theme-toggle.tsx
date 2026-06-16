'use client';
import { MoonIcon, SunIcon } from '@radix-ui/react-icons';
import { Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — only render icon after mount
  useEffect(() => setMounted(true), []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='icon' aria-label='Toggle theme'>
          {/* Sun — shown in light mode */}
          <SunIcon className='h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
          {/* Moon — shown in dark mode */}
          <MoonIcon className='absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
          <span className='sr-only'>Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='min-w-[130px]'>
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className='flex items-center gap-2'
        >
          <SunIcon className='h-4 w-4' />
          Light
          {mounted && theme === 'light' && (
            <span className='ml-auto h-1.5 w-1.5 rounded-full bg-primary' />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className='flex items-center gap-2'
        >
          <MoonIcon className='h-4 w-4' />
          Dark
          {mounted && theme === 'dark' && (
            <span className='ml-auto h-1.5 w-1.5 rounded-full bg-primary' />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className='flex items-center gap-2'
        >
          <Monitor className='h-4 w-4' />
          System
          {mounted && theme === 'system' && (
            <span className='ml-auto h-1.5 w-1.5 rounded-full bg-primary' />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
