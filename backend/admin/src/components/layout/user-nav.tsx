/**
 * Coded by Harith
 * Kampungcetak ®
 */
'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function UserNav({ showDetails = false }: { showDetails?: boolean }) {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className={showDetails
            ? 'relative h-11 w-auto gap-3 rounded-full border border-border/60 bg-background/80 py-1 pl-1 pr-1 shadow-sm hover:bg-background lg:pl-4'
            : 'relative h-8 w-8 rounded-full'}
        >
          {showDetails && (
            <span className='hidden max-w-28 truncate text-sm font-semibold lg:block'>
              {session.user?.name || 'Account'}
            </span>
          )}
          <Avatar className={showDetails ? 'h-9 w-9 ring-2 ring-background' : 'h-8 w-8'}>
            <AvatarImage
              src={((session.user as any)?.avatar || (session.user as any)?.image)?.startsWith('http') ? ((session.user as any)?.avatar || (session.user as any)?.image) : ((session.user as any)?.avatar || (session.user as any)?.image) ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/${((session.user as any)?.avatar || (session.user as any)?.image).replace(/^\//, '')}` : ''}
              alt={session.user?.name ?? ''}
            />
            <AvatarFallback>{session.user?.name?.[0]}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56' align='end' forceMount>
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col space-y-1'>
            <p className='text-sm font-medium leading-none'>
              {session.user?.name}
            </p>
            <p className='text-xs leading-none text-muted-foreground'>
              {session.user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/admin/profile')}>
          Profile Settings
          <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => {
          document.cookie = 'fallback_admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
          signOut({ callbackUrl: '/auth/login' });
        }}>
          Log out
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
