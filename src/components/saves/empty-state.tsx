import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { displayUrl, type OmniboxIntent } from '@/features/saves/omnibox';
import type { Bookmark, SavesCategory } from '@/features/saves/types';
import { cn } from '@/lib/utils';

export type EmptyCopy = {
  title: string;
  description: string;
  action?: { label: string; href: string } | { label: string; onClick: () => void };
};

/**
 * Empty results while the header box has text: a search, or a link that isn't in this
 * view. `saved` is the save with that link elsewhere (another view), if any.
 */
export const searchEmptyCopy = (
  query: string,
  intent: OmniboxIntent,
  saved: Bookmark | undefined,
  onClear: () => void,
): EmptyCopy => {
  if (intent.kind !== 'link') {
    return {
      title: `No saves match \u201c${query}\u201d`,
      description: 'Search looks at titles, sites, links, excerpts and tags in this view.',
      action: { label: 'Clear search', onClick: onClear },
    };
  }
  if (!saved) {
    return {
      title: 'Not in your saves yet',
      description: `Press Enter in the box above to save ${displayUrl(intent.url)}.`,
    };
  }
  return saved.isArchived
    ? {
        title: 'This link is in your Archive',
        description: 'Press Enter to refresh it and move it back to Home.',
        action: { label: 'Open Archive', href: '/saves/archive' },
      }
    : {
        title: 'This link is in Home',
        description: 'Press Enter to refresh its title and image.',
        action: { label: 'Open Home', href: '/saves' },
      };
};

/** What an empty list says, and where it points, for the current view. */
export const emptyCopyFor = (
  category: SavesCategory,
  tagFilter: string | null,
  bookmarks: Bookmark[],
): EmptyCopy => {
  if (tagFilter) {
    return {
      title: `No saves tagged #${tagFilter}`,
      description: `Saves you tag #${tagFilter} show up here.`,
    };
  }
  if (category === 'favorites') {
    return { title: 'No favorites yet', description: 'Star a save to keep it here.' };
  }
  if (category === 'archive') {
    return {
      title: 'Nothing archived',
      description: "Archive a save when you're done with it, and it moves here.",
    };
  }
  if (bookmarks.length === 0) {
    return {
      title: 'Save your first link',
      description:
        'Paste a link into the box above and press Enter. You can also save from Chrome or from Safari on your iPhone.',
      action: { label: 'Set up iPhone saving', href: '/settings' },
    };
  }
  return {
    title: 'Nothing left to read',
    description: 'Everything you saved is in Archive.',
    action: { label: 'Open Archive', href: '/saves/archive' },
  };
};

const ACTION = 'mt-5 h-9 px-3.5';

export function EmptyState({ title, description, action }: EmptyCopy) {
  return (
    <div className="rounded-xl border bg-card px-6 py-10 sm:px-10 sm:py-12">
      <h2 className="font-serif text-xl font-semibold">{title}</h2>
      <p className="mt-1.5 max-w-md text-sm text-muted-foreground">{description}</p>
      {action &&
        ('href' in action ? (
          <Link href={action.href} className={cn(buttonVariants({ variant: 'outline' }), ACTION)}>
            {action.label}
          </Link>
        ) : (
          <Button variant="outline" onClick={action.onClick} className={ACTION}>
            {action.label}
          </Button>
        ))}
    </div>
  );
}
