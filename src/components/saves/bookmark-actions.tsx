'use client';

import { Archive, ArchiveRestore, Ellipsis, Link2, Star, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToastStore } from '@/features/saves/toast-store';
import type { Bookmark } from '@/features/saves/types';
import { cn } from '@/lib/utils';

export type BookmarkHandlers = {
  onToggleFavorite: (bookmark: Bookmark) => void;
  onToggleArchive: (bookmark: Bookmark) => void;
  onDelete: (bookmark: Bookmark) => void;
  onTagClick: (tag: string) => void;
};

type BookmarkActionsProps = {
  bookmark: Bookmark;
  handlers: BookmarkHandlers;
  className?: string;
};

// 36px targets on phones, 32px from sm up.
const ICON_BUTTON =
  'inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:size-8';

/** Favorite and archive toggles plus a menu with the rest (copy link, delete). */
export function BookmarkActions({ bookmark, handlers, className }: BookmarkActionsProps) {
  const showToast = useToastStore((s) => s.show);
  const archiveLabel = bookmark.isArchived ? 'Unarchive' : 'Archive';
  const ArchiveIcon = bookmark.isArchived ? ArchiveRestore : Archive;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(bookmark.url);
      showToast('Link copied');
    } catch {
      showToast("Couldn't copy the link. Open it and copy it from the address bar.");
    }
  }

  return (
    <div className={cn('relative z-10 flex shrink-0 items-center', className)}>
      <button
        type="button"
        aria-pressed={bookmark.isFavorite}
        aria-label="Favorite"
        title={bookmark.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
        onClick={() => handlers.onToggleFavorite(bookmark)}
        className={cn(ICON_BUTTON, bookmark.isFavorite && 'text-primary hover:text-primary')}
      >
        <Star className="size-4" fill={bookmark.isFavorite ? 'currentColor' : 'none'} />
      </button>
      <button
        type="button"
        aria-label={archiveLabel}
        title={archiveLabel}
        onClick={() => handlers.onToggleArchive(bookmark)}
        className={cn(ICON_BUTTON, 'hidden sm:inline-flex')}
      >
        <ArchiveIcon className="size-4" />
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger aria-label="More actions" title="More actions" className={ICON_BUTTON}>
          <Ellipsis className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem className="py-1.5" onClick={() => handlers.onToggleArchive(bookmark)}>
            <ArchiveIcon /> {archiveLabel}
          </DropdownMenuItem>
          <DropdownMenuItem className="py-1.5" onClick={copyLink}>
            <Link2 /> Copy link
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            className="py-1.5"
            onClick={() => handlers.onDelete(bookmark)}
          >
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
