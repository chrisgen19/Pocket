'use client';

import { Hash } from 'lucide-react';
import Link from 'next/link';
import type { SavesCategory } from '@/features/saves/types';
import { cn } from '@/lib/utils';
import { SAVES_CATEGORIES, useSavesNav } from './use-saves-nav';

type SidebarProps = {
  category: SavesCategory;
  tagFilter: string | null;
};

export function Sidebar({ category, tagFilter }: SidebarProps) {
  const { tags, tagHref } = useSavesNav(tagFilter);

  return (
    <aside className="w-full lg:w-64 flex-shrink-0 hidden md:block">
      <div className="sticky top-24">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          My List
        </h2>
        <nav className="space-y-1">
          {SAVES_CATEGORIES.map(({ key, label, href, Icon }) => {
            const active = !tagFilter && category === key;
            return (
              <Link
                key={key}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  active
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                )}
              >
                <Icon
                  className={cn(
                    'mr-3 w-4 h-4',
                    active ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                  )}
                />
                {label}
              </Link>
            );
          })}
        </nav>

        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-8 mb-3">
          Tags
        </h2>
        <nav className="space-y-1">
          {tags.length === 0 ? (
            <p className="text-sm text-gray-400 px-3 py-2 italic">No tags yet</p>
          ) : (
            tags.map((tag) => {
              const active = tagFilter === tag;
              return (
                <Link
                  key={tag}
                  href={tagHref(tag)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    active
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  )}
                >
                  <Hash
                    className={cn(
                      'mr-3 w-4 h-4',
                      active ? 'text-gray-500' : 'text-gray-400 group-hover:text-gray-500',
                    )}
                  />
                  <span className="truncate">{tag}</span>
                </Link>
              );
            })
          )}
        </nav>
      </div>
    </aside>
  );
}
