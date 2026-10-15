'use client';

import { CircleAlert, Loader2, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { displayUrl } from '@/features/saves/omnibox';
import type { PendingSave } from '@/features/saves/save-queue-store';
import { cn } from '@/lib/utils';

type PendingSaveRowProps = {
  item: PendingSave;
  onRetry: (url: string) => void;
  onDismiss: (url: string) => void;
};

/**
 * A link that is waiting, saving, or failed to save, in the shape of a list row. It
 * drops in at the top of the list; once saved, the real row takes its place.
 */
export function PendingSaveRow({ item, onRetry, onDismiss }: PendingSaveRowProps) {
  const failed = item.status === 'error';
  const label = displayUrl(item.url);

  return (
    <article
      aria-busy={!failed}
      className="flex gap-3 px-3 py-3.5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 sm:gap-4 sm:px-5 sm:py-4"
    >
      <div
        className={cn(
          'h-16 w-24 shrink-0 rounded-md sm:h-[76px] sm:w-28',
          failed ? 'bg-destructive/10' : 'bg-muted motion-safe:animate-pulse',
        )}
      />
      <div className="min-w-0 flex-1">
        <p
          title={item.url}
          className="truncate font-serif text-[1.0625rem] leading-6 font-medium sm:text-lg"
        >
          {label}
        </p>
        {failed ? (
          <>
            <p className="mt-0.5 flex items-start gap-1.5 text-sm text-destructive">
              <CircleAlert className="mt-0.5 size-4 shrink-0" />
              {item.error}
            </p>
            <div className="mt-2.5 flex gap-2">
              {item.retryable && (
                <Button
                  variant="outline"
                  aria-label={`Retry saving ${label}`}
                  onClick={() => onRetry(item.url)}
                  className="h-8 px-3"
                >
                  <RotateCw /> Retry
                </Button>
              )}
              <Button
                variant="ghost"
                aria-label={`Dismiss ${label}`}
                onClick={() => onDismiss(item.url)}
                className="h-8 px-3"
              >
                Dismiss
              </Button>
            </div>
          </>
        ) : (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Loader2 className="size-3.5 motion-safe:animate-spin" />
            {item.status === 'queued' ? 'Waiting to save' : 'Saving, getting the title and image'}
          </p>
        )}
        {item.tags.length > 0 && (
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {item.tags.map((tag) => `#${tag}`).join(' ')}
          </p>
        )}
      </div>
    </article>
  );
}
