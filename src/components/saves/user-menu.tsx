'use client';

import { useQueryClient } from '@tanstack/react-query';
import { LogOut, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToastStore } from '@/features/saves/toast-store';
import { signOut, useSession } from '@/lib/auth-client';

export function UserMenu() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const qc = useQueryClient();
  const showToast = useToastStore((s) => s.show);

  async function handleSignOut() {
    // Only clear local state + redirect once the server confirms the session
    // is gone. Otherwise the UI would say "logged out" while the cookie still
    // authenticates subsequent requests.
    try {
      const result = await signOut();
      if (result?.error) {
        showToast(result.error.message ?? 'Sign out failed');
        return;
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Sign out failed');
      return;
    }
    qc.clear();
    router.push('/login');
    router.refresh();
  }

  if (isPending) {
    return <div className="size-8 rounded-full bg-muted motion-safe:animate-pulse" />;
  }

  if (!session?.user) {
    return (
      <button
        type="button"
        onClick={() => router.push('/login')}
        className="rounded-md px-2 py-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        Sign in
      </button>
    );
  }

  const initial = (session.user.name || session.user.email || '?').charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex size-8 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background"
        aria-label="Account menu"
      >
        {initial}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* GroupLabel (which DropdownMenuLabel wraps) must be inside a Group. */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col">
              <span className="truncate text-sm font-medium text-foreground">
                {session.user.name || 'Account'}
              </span>
              <span className="truncate text-xs text-muted-foreground">{session.user.email}</span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="py-1.5" onClick={() => router.push('/settings')}>
          <Settings /> Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" className="py-1.5" onClick={handleSignOut}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
