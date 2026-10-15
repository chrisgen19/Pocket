'use client';

import { LayoutGrid, List, X } from 'lucide-react';
import type { SavesView } from '@/features/saves/types';
import { cn } from '@/lib/utils';

type SavesHeadingProps = {
  title: string;
  /** Saves in this view; null while they load. */
  count: number | null;
  view: SavesView;
  onViewChange: (view: SavesView) => void;
  /** Set while searching: shows a button that empties the header box. */
  onClearSearch?: () => void;
};

const VIEWS = [
  { value: 'list', label: 'List view', Icon: List },
  { value: 'grid', label: 'Grid view', Icon: LayoutGrid },
] as const;

/** Page title for the current view, its save count, and the list/grid switch. */
export function SavesHeading(props: SavesHeadingProps) {
  const { title, count, view, onViewChange, onClearSearch } = props;
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="truncate font-serif text-2xl leading-tight font-semibold tracking-[-0.005em] md:text-[1.75rem]">
          {title}
        </h1>
        <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
          {/* Polite live region: the result count is read out as a search narrows. */}
          <p aria-live="polite" className="tabular-nums">
            {count === null ? '\u00a0' : `${count} ${count === 1 ? 'save' : 'saves'}`}
          </p>
          {onClearSearch && (
            <button
              type="button"
              onClick={onClearSearch}
              className="inline-flex items-center gap-1 rounded-sm font-medium text-foreground underline-offset-2 hover:underline"
            >
              <X className="size-3.5" />
              Clear search
            </button>
          )}
        </div>
      </div>
      <fieldset className="flex shrink-0 rounded-lg border bg-card p-0.5">
        <legend className="sr-only">Layout</legend>
        {VIEWS.map(({ value, label, Icon }) => (
          <button
            key={value}
            type="button"
            aria-pressed={view === value}
            aria-label={label}
            title={label}
            onClick={() => onViewChange(value)}
            className={cn(
              'inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground',
              view === value && 'bg-muted text-foreground',
            )}
          >
            <Icon className="size-4" />
          </button>
        ))}
      </fieldset>
    </div>
  );
}
