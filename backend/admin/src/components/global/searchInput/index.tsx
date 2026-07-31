/**
 * Coded by Harith
 * Kampungcetak ®
 */
'use client';
import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  showShortcut?: boolean;
}

export default function SearchInput({
  className,
  inputClassName,
  placeholder = 'Search orders or users...',
  showShortcut = true,
}: SearchInputProps = {}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputRef.current?.value.trim();
    if (query) {
      router.push(`/admin/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className={cn('relative w-full space-y-2', className)}>
      <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
      <Input
        ref={inputRef}
        placeholder={placeholder}
        className={cn('h-9 w-full rounded-[0.5rem] bg-background pl-9 pr-12 text-sm shadow-none md:w-40 lg:w-64', inputClassName)}
      />
      {showShortcut && (
        <kbd className='pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex'>
          <span className='text-xs'>⌘</span>K
        </kbd>
      )}
    </form>
  );
}
