'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { UserMenu } from './user-menu';

type NavbarProps = {
  onAddClick: () => void;
};

export function Navbar({ onAddClick }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-card">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/saves" aria-label="Pocket home" className="rounded-md">
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={onAddClick}
            className="hidden h-9 px-3 text-muted-foreground sm:inline-flex"
          >
            <Plus /> Save a link
          </Button>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
