'use client';

import type { Bookmark } from '@/features/saves/types';
import { BookmarkActions, type BookmarkHandlers } from './bookmark-actions';
import { BookmarkCover } from './bookmark-cover';
import { BookmarkMeta, BookmarkTags } from './bookmark-meta';
import { BookmarkTagsEditor } from './bookmark-tags-editor';

type BookmarkTileProps = {
  bookmark: Bookmark;
  handlers: BookmarkHandlers;
  busy?: boolean;
  editing?: boolean;
};

/** One save in the grid view: cover on top, then title, excerpt, meta and actions. */
export function BookmarkTile({ bookmark, handlers, busy, editing }: BookmarkTileProps) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border bg-card">
      <BookmarkCover bookmark={bookmark} size="lg" className="aspect-[16/10] w-full border-b" />
      <div className="flex flex-1 flex-col p-4">
        <BookmarkMeta bookmark={bookmark} className="mb-1.5" />
        <h2 className="font-serif text-xl leading-[1.625rem] font-medium">
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
          <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{bookmark.excerpt}</p>
        )}
        {editing && (
          <BookmarkTagsEditor
            bookmark={bookmark}
            onSave={(tags) => handlers.onSaveTags(bookmark, tags)}
            onCancel={handlers.onCancelEditTags}
            className="mt-3"
          />
        )}
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          {!editing && (
            <BookmarkTags
              tags={bookmark.tags}
              onTagClick={handlers.onTagClick}
              className="min-w-0 pb-2"
            />
          )}
          <BookmarkActions
            bookmark={bookmark}
            handlers={handlers}
            busy={busy}
            className="-mr-1.5 -mb-1 ml-auto"
          />
        </div>
      </div>
    </article>
  );
}
