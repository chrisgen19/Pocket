'use client';

import { LayoutGrid, List } from 'lucide-react';
import type { SavesView } from '@/features/saves/types';
import { cn } from '@/lib/utils';

type SavesHeadingProps = {
  title: string;
  /** Saves in this view; null while they load. */
  count: number | null;
  view: SavesView;
  onViewChange: (view: SavesView) => void;
};

const VIEWS = [
  { value: 'list', label: 'List view', Icon: List },
  { value: 'grid', label: 'Grid view', Icon: LayoutGrid },
] as const;

/** Page title for the current view, its save count, and the list/grid switch. */
export function SavesHeading({ title, count, view, onViewChange }: SavesHeadingProps) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="truncate font-serif text-2xl leading-tight font-semibold tracking-[-0.005em] md:text-[1.75rem]">
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground tabular-nums">
          {count === null ? ' ' : `${count} ${count === 1 ? 'save' : 'saves'}`}
        </p>
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
