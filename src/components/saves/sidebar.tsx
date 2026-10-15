'use client';

import { Hash, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import type { SavesCategory } from '@/features/saves/types';
import { cn } from '@/lib/utils';
import { SAVES_CATEGORIES, useSavesNav } from './use-saves-nav';

type SidebarProps = {
  category: SavesCategory;
  tagFilter: string | null;
};

export function Sidebar({ category, tagFilter }: SidebarProps) {
  const { tags, countFor, tagCountFor, tagHref, loaded } = useSavesNav(tagFilter);

  return (
    <aside className="hidden w-48 shrink-0 md:block lg:w-56">
      <div className="sticky top-24 max-h-[calc(100dvh-7rem)] space-y-8 overflow-y-auto pb-4">
        <nav aria-label="Saves" className="space-y-0.5">
          {SAVES_CATEGORIES.map(({ key, label, href, Icon }) => (
            <NavItem
              key={key}
              href={href}
              label={label}
              Icon={Icon}
              count={countFor(key)}
              active={!tagFilter && category === key}
            />
          ))}
        </nav>

        <nav aria-labelledby="sidebar-tags-heading">
          <h2
            id="sidebar-tags-heading"
            className="mb-1.5 px-3 text-[0.8125rem] font-semibold text-muted-foreground"
          >
            Tags
          </h2>
          {tags.length === 0 ? (
            <p className="px-3 py-1.5 text-sm text-muted-foreground">
              {loaded ? 'Tags you add show up here.' : ' '}
            </p>
          ) : (
            <div className="space-y-0.5">
              {tags.map((tag) => (
                <NavItem
                  key={tag}
                  href={tagHref(tag)}
                  label={tag}
                  Icon={Hash}
                  count={tagCountFor(tag)}
                  active={tagFilter === tag}
                />
              ))}
            </div>
          )}
        </nav>
      </div>
    </aside>
  );
}

type NavItemProps = {
  href: string;
  label: string;
  Icon: LucideIcon;
  count: number | null;
  active: boolean;
};

function NavItem({ href, label, Icon, count, active }: NavItemProps) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
        active
          ? 'bg-card font-semibold text-foreground ring-1 ring-border'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <Icon className={cn('size-4 shrink-0', active && 'text-primary')} />
      <span className="truncate">{label}</span>
      {count !== null && (
        <span className="ml-auto text-xs font-medium text-muted-foreground tabular-nums">
          {count}
        </span>
      )}
    </Link>
  );
}
