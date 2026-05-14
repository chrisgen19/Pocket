'use client';

import { Archive, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { Bookmark } from '@/features/saves/types';
import { timeAgo } from '@/features/saves/utils';
import { cn } from '@/lib/utils';

const FALLBACK_IMAGE = 'https://placehold.co/600x400/f3f4f6/9ca3af?text=No+Image';

type BookmarkCardProps = {
  bookmark: Bookmark;
  view: 'grid' | 'list';
  onToggleFavorite: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onDelete: (id: string) => void;
};

export function BookmarkCard({
  bookmark,
  view,
  onToggleFavorite,
  onToggleArchive,
  onDelete,
}: BookmarkCardProps) {
  const [imgSrc, setImgSrc] = useState(bookmark.imageUrl);

  const meta = (
    <div className="flex items-center mb-2 text-xs font-medium text-gray-500 uppercase tracking-wide w-full">
      <span className="truncate min-w-0" title={bookmark.domain}>
        {bookmark.domain}
      </span>
      <span className="mx-2 flex-shrink-0">•</span>
      <span className="flex-shrink-0 whitespace-nowrap">{timeAgo(bookmark.dateAdded)}</span>
    </div>
  );

  const titleAndExcerpt = (
    <>
      <a
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block mb-2 group-hover:text-red-600 transition-colors"
      >
        <h2
          className="text-lg font-bold leading-tight text-gray-900 line-clamp-2"
          title={bookmark.title}
        >
          {bookmark.title}
        </h2>
      </a>
      <p
        className={cn(
          'text-sm text-gray-600 mb-3 flex-grow',
          view === 'grid' ? 'line-clamp-3' : 'line-clamp-2',
        )}
      >
        {bookmark.excerpt || bookmark.url}
      </p>
    </>
  );

  const tags = bookmark.tags.length > 0 && (
    <div className="flex flex-wrap gap-2 mb-4">
      {bookmark.tags.map((tag) => (
        <span
          key={tag}
          className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium"
        >
          #{tag}
        </span>
      ))}
    </div>
  );

  const actions = (
    <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
      <div className="flex space-x-3">
        <button
          type="button"
          onClick={() => onToggleFavorite(bookmark.id)}
          className="hover:text-gray-800 transition-colors"
          title={bookmark.isFavorite ? 'Unfavorite' : 'Favorite'}
        >
          <Star
            className={cn('w-4 h-4', bookmark.isFavorite ? 'text-yellow-500' : 'text-gray-400')}
            fill={bookmark.isFavorite ? 'currentColor' : 'none'}
          />
        </button>
        <button
          type="button"
          onClick={() => onToggleArchive(bookmark.id)}
          className="hover:text-gray-800 transition-colors"
          title={bookmark.isArchived ? 'Unarchive' : 'Archive'}
        >
          <Archive
            className={cn('w-4 h-4', bookmark.isArchived ? 'text-indigo-500' : 'text-gray-400')}
          />
        </button>
      </div>
      <button
        type="button"
        onClick={() => onDelete(bookmark.id)}
        className="text-gray-400 hover:text-red-500 transition-colors"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  const image = (
    <a
      href={bookmark.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'block bg-gray-100 overflow-hidden flex-shrink-0',
        view === 'grid' ? 'aspect-video' : 'w-full sm:w-64 h-48 sm:h-auto',
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgSrc}
        alt={`Cover for ${bookmark.title}`}
        onError={() => setImgSrc(FALLBACK_IMAGE)}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    </a>
  );

  return (
    <article
      className={cn(
        'bookmark-card bg-white rounded-xl overflow-hidden border border-gray-200 flex relative group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg',
        view === 'grid' ? 'flex-col h-full' : 'flex-col sm:flex-row',
      )}
    >
      {image}
      <div className="p-4 flex flex-col flex-grow">
        {meta}
        {titleAndExcerpt}
        {tags}
        {actions}
      </div>
    </article>
  );
}
