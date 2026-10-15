'use client';

import type { Bookmark } from '@/features/saves/types';
import { BookmarkActions, type BookmarkHandlers } from './bookmark-actions';
import { BookmarkCover } from './bookmark-cover';
import { BookmarkMeta } from './bookmark-meta';

type BookmarkRowProps = {
  bookmark: Bookmark;
  handlers: BookmarkHandlers;
};

/** One save in the list view: thumbnail, title, excerpt (md+), meta and actions. */
export function BookmarkRow({ bookmark, handlers }: BookmarkRowProps) {
  return (
    <article className="group relative flex gap-3 px-3 py-3.5 transition-colors hover:bg-muted/40 sm:gap-4 sm:px-5 sm:py-4">
      <BookmarkCover
        bookmark={bookmark}
        size="sm"
        className="h-16 w-24 shrink-0 rounded-md sm:h-[76px] sm:w-28"
      />
      <div className="min-w-0 flex-1">
        <h2 className="font-serif text-[1.0625rem] leading-6 font-medium sm:text-lg">
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            title={bookmark.title}
            className="line-clamp-2 rounded-sm decoration-1 underline-offset-[3px] wrap-anywhere group-hover:underline after:absolute after:inset-0"
          >
            {bookmark.title}
          </a>
        </h2>
        {bookmark.excerpt && (
          <p className="mt-0.5 hidden text-sm text-muted-foreground md:line-clamp-1">
            {bookmark.excerpt}
          </p>
        )}
        <BookmarkMeta bookmark={bookmark} onTagClick={handlers.onTagClick} className="mt-1.5" />
      </div>
      <BookmarkActions
        bookmark={bookmark}
        handlers={handlers}
        className="-mt-1 -mr-1.5 self-start"
      />
    </article>
  );
}
