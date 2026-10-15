'use client';

import { Hash } from 'lucide-react';
import Link from 'next/link';
import type { SavesCategory } from '@/features/saves/types';
import { cn } from '@/lib/utils';
import { SAVES_CATEGORIES, useSavesNav } from './use-saves-nav';

type MobileNavProps = {
  category: SavesCategory;
  tagFilter: string | null;
};

const CHIP =
  'flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors';
const CHIP_ACTIVE = 'border-foreground bg-foreground text-background';
const CHIP_IDLE = 'bg-card text-muted-foreground hover:text-foreground';
const COUNT = 'text-xs tabular-nums opacity-70';

// Ref callback for the active chip: React calls it whenever a different chip becomes
// active (including once tags load), so a tag far down the row is scrolled into view.
// Adjusts only the row's scrollLeft (not scrollIntoView) so the page never jumps.
// The row is display:none at md and up, where it measures zero, so a ResizeObserver
// re-centers once it becomes visible (e.g. resizing or rotating below md).
const centerInRow = (chip: HTMLElement | null) => {
  const row = chip?.closest('nav');
  if (!chip || !row) return;
  const center = () => {
    const rowRect = row.getBoundingClientRect();
    if (rowRect.width === 0) return;
    const chipRect = chip.getBoundingClientRect();
    row.scrollLeft += chipRect.left - rowRect.left - (rowRect.width - chipRect.width) / 2;
  };
  // observe() also fires once immediately, which covers the initial center.
  const observer = new ResizeObserver(center);
  observer.observe(row);
  return () => observer.disconnect();
};

// Horizontal, scrollable stand-in for the sidebar below the md breakpoint, where
// the sidebar is hidden.
export function MobileNav({ category, tagFilter }: MobileNavProps) {
  const { tags, countFor, tagCountFor, tagHref } = useSavesNav(tagFilter);

  return (
    <nav
      aria-label="Saves navigation"
      className="md:hidden -mx-4 mb-6 overflow-x-auto px-4 sm:-mx-6 sm:px-6 [scrollbar-width:none]"
    >
      <div className="flex w-max items-center gap-2 pb-1">
        {SAVES_CATEGORIES.map(({ key, label, href, Icon }) => {
          const active = !tagFilter && category === key;
          return (
            <Link
              key={key}
              ref={active ? centerInRow : undefined}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(CHIP, active ? CHIP_ACTIVE : CHIP_IDLE)}
            >
              <Icon className="h-4 w-4" />
              {label}
              <Count value={countFor(key)} />
            </Link>
          );
        })}

        {tags.length > 0 && <span aria-hidden="true" className="mx-1 h-6 w-px bg-border" />}

        {tags.map((tag) => {
          const active = tagFilter === tag;
          return (
            <Link
              key={tag}
              ref={active ? centerInRow : undefined}
              href={tagHref(tag)}
              aria-current={active ? 'page' : undefined}
              className={cn(CHIP, active ? CHIP_ACTIVE : CHIP_IDLE)}
            >
              <Hash className="h-3.5 w-3.5" />
              {tag}
              <Count value={tagCountFor(tag)} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function Count({ value }: { value: number | null }) {
  return value === null ? null : <span className={COUNT}>{value}</span>;
}
