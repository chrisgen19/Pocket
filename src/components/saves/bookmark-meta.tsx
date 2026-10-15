'use client';

import type { Bookmark } from '@/features/saves/types';
import { timeAgo } from '@/features/saves/utils';
import { cn } from '@/lib/utils';

type BookmarkMetaProps = {
  bookmark: Bookmark;
  /** Omit to leave tags out (the grid tile shows them in its footer instead). */
  onTagClick?: (tag: string) => void;
  className?: string;
};

const ROW = 'flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-muted-foreground';

/** Domain, age and, when onTagClick is given, tags (each tag filters the list). */
export function BookmarkMeta({ bookmark, onTagClick, className }: BookmarkMetaProps) {
  const added = new Date(bookmark.dateAdded);

  return (
    <div className={cn(ROW, className)}>
      <span className="max-w-[16rem] truncate" title={bookmark.domain}>
        {bookmark.domain}
      </span>
      <time dateTime={added.toISOString()} title={added.toLocaleString()} className="shrink-0">
        {timeAgo(bookmark.dateAdded)}
      </time>
      {onTagClick && <TagLinks tags={bookmark.tags} onTagClick={onTagClick} />}
    </div>
  );
}

type BookmarkTagsProps = {
  tags: string[];
  onTagClick: (tag: string) => void;
  className?: string;
};

/** Tags on their own line, for the grid tile footer. */
export function BookmarkTags({ tags, onTagClick, className }: BookmarkTagsProps) {
  return (
    <div className={cn(ROW, className)}>
      <TagLinks tags={tags} onTagClick={onTagClick} />
    </div>
  );
}

function TagLinks({ tags, onTagClick }: { tags: string[]; onTagClick: (tag: string) => void }) {
  return tags.map((tag) => (
    <button
      key={tag}
      type="button"
      onClick={() => onTagClick(tag)}
      title={`Show saves tagged #${tag}`}
      className="relative z-10 rounded-sm underline-offset-2 hover:text-foreground hover:underline"
    >
      #{tag}
    </button>
  ));
}
