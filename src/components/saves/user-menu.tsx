'use client';

import { LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
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
    return <div className="w-8 h-8 bg-gray-100 rounded-full animate-pulse" />;
  }

  if (!session?.user) {
    return (
      <button
        type="button"
        onClick={() => router.push('/login')}
        className="text-sm font-medium text-gray-700 hover:text-gray-900"
      >
        Sign in
      </button>
    );
  }

  const initial = (session.user.name || session.user.email || '?').charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        aria-label="Account menu"
      >
        {initial}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900 truncate">
              {session.user.name || 'Account'}
            </span>
            <span className="text-xs text-gray-500 truncate">{session.user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <User className="w-4 h-4 mr-2" /> Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-700">
          <LogOut className="w-4 h-4 mr-2" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
