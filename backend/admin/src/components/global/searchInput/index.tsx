/**
 * Coded by Harith
 * Kampungcetak ®
 */
'use client';
import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LoaderCircle, Search } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { getTasks } from '@/api/tasks';
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
  const { data: session, status } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const [results, setResults] = useState<any[]>([]);
  const [searchedQuery, setSearchedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!formRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      requestIdRef.current += 1;
    };
  }, []);

  const runLiveSearch = async (query: string) => {
    if (status !== 'authenticated') return;
    const requestId = ++requestIdRef.current;
    setIsSearching(true);
    setIsOpen(true);
    setSearchedQuery(query);
    try {
      const response = await getTasks(session?.user?.token, { search: query, limit: '8' });
      if (requestId !== requestIdRef.current) return;
      startTransition(() => {
        setResults(response?.tasks || []);
        setSearchedQuery(query);
      });
    } catch {
      if (requestId === requestIdRef.current) setResults([]);
    } finally {
      if (requestId === requestIdRef.current) setIsSearching(false);
    }
  };

  const handleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.currentTarget.value.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    requestIdRef.current += 1;

    if (query.length < 2) {
      startTransition(() => {
        setResults([]);
        setSearchedQuery(query);
        setIsOpen(false);
        setIsSearching(false);
      });
      return;
    }

    debounceRef.current = setTimeout(() => void runLiveSearch(query), 150);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputRef.current?.value.trim();
    if (query) {
      router.push(`/admin/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSearch} className={cn('relative w-full space-y-2', className)}>
      <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
      <Input
        ref={inputRef}
        onChange={handleInput}
        onFocus={() => {
          if ((inputRef.current?.value.trim().length || 0) >= 2) setIsOpen(true);
        }}
        placeholder={placeholder}
        className={cn('h-9 w-full rounded-[0.5rem] bg-background pl-9 pr-12 text-sm shadow-none md:w-40 lg:w-64', inputClassName)}
      />
      {showShortcut && (
        <kbd className='pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex'>
          <span className='text-xs'>⌘</span>K
        </kbd>
      )}
      {isOpen && (
        <div className='absolute right-0 top-full z-[100] mt-2 w-[min(28rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl'>
          {isSearching ? (
            <div className='flex items-center gap-2 p-4 text-sm text-muted-foreground'>
              <LoaderCircle className='h-4 w-4 animate-spin' /> Searching...
            </div>
          ) : results.length > 0 ? (
            <div className='p-1.5'>
              {results.map(task => (
                <button
                  key={task._id}
                  type='button'
                  className='flex w-full flex-col gap-1 rounded-lg px-3 py-2 text-left hover:bg-muted'
                  onClick={() => {
                    setIsOpen(false);
                    router.push(`/admin/tasks?taskId=${task._id}`);
                  }}
                >
                  <span className='truncate text-sm font-semibold'>{task.title}</span>
                  <span className='text-xs text-muted-foreground'>
                    {task.status?.replace(/_/g, ' ')}{task.orderId ? ` - ${task.orderId}` : ''}
                  </span>
                </button>
              ))}
              <button
                type='button'
                className='mt-1 w-full border-t border-border px-3 py-2 text-left text-xs font-medium text-primary hover:bg-muted'
                onClick={() => {
                  setIsOpen(false);
                  router.push(`/admin/search?q=${encodeURIComponent(searchedQuery)}`);
                }}
              >
                View all results for "{searchedQuery}"
              </button>
            </div>
          ) : (
            <div className='p-4 text-sm text-muted-foreground'>No tasks found for "{searchedQuery}".</div>
          )}
        </div>
      )}
    </form>
  );
}
