'use client';

import { CircleAlert, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { displayUrl, type OmniboxIntent } from '@/features/saves/omnibox';
import type { Bookmark } from '@/features/saves/types';
import { TagChipsInput } from './tag-chips-input';

type OmniboxPanelProps = {
  intent: Extract<OmniboxIntent, { kind: 'link' | 'links' | 'invalid' }>;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  tagSuggestions: string[];
  bookmarks: Bookmark[];
  /** Id of the line the box points at with aria-describedby. */
  summaryId: string;
  onSubmit: () => void;
  onEscape: () => void;
};

const PANEL =
  'absolute inset-x-0 top-full z-50 mt-2 rounded-xl border bg-popover p-3 text-popover-foreground shadow-float outline-none sm:p-4';

/** What one save would do with an existing save of the same link. */
const existingNote = (existing: Bookmark): string =>
  existing.isArchived
    ? 'Already in your saves, in Archive. Saving again refreshes it and moves it back to Home.'
    : 'Already in your saves. Saving again refreshes its title and image.';

/** Shown under the header box when its text is a link (or several): save, with tags. */
export function OmniboxPanel(props: OmniboxPanelProps) {
  const { intent, tags, onTagsChange, tagSuggestions, bookmarks, summaryId } = props;

  if (intent.kind === 'invalid') {
    return (
      // tabIndex -1: clicking inside keeps focus within the box, so the panel stays open.
      <div tabIndex={-1} className={PANEL}>
        <p id={summaryId} className="flex items-start gap-2 text-sm text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          {intent.message}
        </p>
      </div>
    );
  }

  const urls = intent.kind === 'link' ? [intent.url] : intent.urls;
  const saved = new Map(bookmarks.map((b) => [b.url, b]));
  const existing = urls.filter((url) => saved.has(url)).length;
  const single = urls.length === 1;
  const first = saved.get(urls[0]);
  const note = single
    ? first
      ? existingNote(first)
      : 'Press Enter to save it to Home.'
    : existing > 0
      ? `Press Enter to save them. ${existing} already in your saves will be refreshed.`
      : 'Press Enter to save them to Home.';

  return (
    <div tabIndex={-1} className={PANEL}>
      <div className="flex items-start gap-3">
        <Link2 className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium" title={single ? urls[0] : undefined}>
            {single ? displayUrl(urls[0]) : `${urls.length} links`}
          </p>
          {!single && (
            <ul className="mt-1 max-h-28 space-y-0.5 overflow-auto text-xs text-muted-foreground">
              {urls.map((url) => (
                <li key={url} className="truncate" title={url}>
                  {displayUrl(url)}
                  {saved.has(url) && ' (already saved)'}
                </li>
              ))}
            </ul>
          )}
          <p id={summaryId} className="mt-1 text-xs text-muted-foreground">
            {note}
          </p>
        </div>
        <Button onClick={props.onSubmit} className="h-9 shrink-0 px-3.5 hover:bg-primary/90">
          {single ? 'Save' : `Save ${urls.length} links`}
        </Button>
      </div>
      <TagChipsInput
        className="mt-3 sm:ml-7"
        value={tags}
        onChange={onTagsChange}
        suggestions={tagSuggestions}
        label={single ? 'Tags for this link' : 'Tags for these links'}
        placeholder={single ? 'Add tags (optional)' : 'Add tags to all of them (optional)'}
        onSubmit={props.onSubmit}
        onEscape={props.onEscape}
      />
    </div>
  );
}
