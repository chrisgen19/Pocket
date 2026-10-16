import { BookmarkCheck } from 'lucide-react';
import type { SavedBookmark } from '@/lib/api';

/** Tells the user this tab is already saved, and what saving it again does. */
export function SavedNotice({ bookmark }: { bookmark: SavedBookmark }) {
  const savedOn = new Date(bookmark.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      role="status"
      className="space-y-2 rounded-lg bg-notice px-3 py-2.5 text-notice-foreground"
    >
      <p className="flex items-center gap-1.5 text-xs font-medium">
        <BookmarkCheck className="size-3.5 shrink-0" />
        Already in your Pocket, saved {savedOn}
        {bookmark.isArchived && ' (archived)'}
      </p>
      {bookmark.tags.length > 0 && (
        <ul className="flex flex-wrap gap-1" aria-label="Current tags">
          {bookmark.tags.map((tag) => (
            <li key={tag} className="rounded-md bg-card px-2 py-0.5 text-xs text-foreground">
              {tag}
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs">
        Update adds any new tags
        {bookmark.isArchived ? ' and moves it back to your list.' : '.'}
      </p>
    </div>
  );
}
