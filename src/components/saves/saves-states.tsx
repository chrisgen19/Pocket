'use client';

import { Loader2, RotateCw } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import type { SavesView } from '@/features/saves/types';
import { cn } from '@/lib/utils';

const SKELETON_ITEMS = [0, 1, 2, 3, 4, 5];
const BAR = 'rounded bg-muted motion-safe:animate-pulse';

/** Placeholder rows or tiles shaped like the current view while saves load. */
export function SavesSkeleton({ view }: { view: SavesView }) {
  return (
    <>
      <p role="status" className="sr-only">
        Loading your saves
      </p>
      {view === 'grid' ? (
        <div aria-hidden="true" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {SKELETON_ITEMS.map((item) => (
            <div key={item} className="overflow-hidden rounded-xl border bg-card">
              <div className={cn(BAR, 'aspect-[16/10] rounded-none')} />
              <div className="space-y-2.5 p-4">
                <div className={cn(BAR, 'h-5 w-4/5')} />
                <div className={cn(BAR, 'h-3.5 w-full')} />
                <div className={cn(BAR, 'h-3 w-1/3')} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div aria-hidden="true" className="divide-y overflow-hidden rounded-xl border bg-card">
          {SKELETON_ITEMS.map((item) => (
            <div key={item} className="flex gap-3 px-3 py-3.5 sm:gap-4 sm:px-5 sm:py-4">
              <div className={cn(BAR, 'h-16 w-24 shrink-0 rounded-md sm:h-[76px] sm:w-28')} />
              <div className="flex-1 space-y-2.5 pt-1">
                <div className={cn(BAR, 'h-4 w-3/4')} />
                <div className={cn(BAR, 'h-4 w-1/2')} />
                <div className={cn(BAR, 'h-3 w-1/4')} />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

type SavesErrorProps = {
  message: string;
  onRetry: () => void;
  retrying: boolean;
};

export function SavesError({ message, onRetry, retrying }: SavesErrorProps) {
  return (
    <div role="alert" className="rounded-xl border bg-card px-6 py-10 sm:px-10">
      <h2 className="font-serif text-xl font-semibold">Couldn't load your saves</h2>
      <p className="mt-1.5 max-w-md text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" className="mt-5 h-9 px-3.5" onClick={onRetry} disabled={retrying}>
        {retrying ? <Loader2 className="animate-spin" /> : <RotateCw />}
        Try again
      </Button>
    </div>
  );
}

/** The session cookie is there but the API rejected it (expired or revoked). */
export function SessionEnded() {
  const pathname = usePathname();
  return (
    <div className="rounded-xl border bg-card px-6 py-10 sm:px-10">
      <h2 className="font-serif text-xl font-semibold">Your session has ended</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">Sign in again to see your saves.</p>
      <Link
        href={`/login?next=${encodeURIComponent(pathname)}`}
        className={cn(buttonVariants(), 'mt-5 h-9 px-4 hover:bg-primary/90')}
      >
        Sign in
      </Link>
    </div>
  );
}
