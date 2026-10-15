'use client';

import Image from 'next/image';
import { useState } from 'react';
import { coverHue } from '@/features/saves/cover';
import type { Bookmark } from '@/features/saves/types';
import { cn } from '@/lib/utils';

type BookmarkCoverProps = {
  bookmark: Bookmark;
  /** sm: list thumbnail with the domain's initial. lg: grid cover with the full domain. */
  size: 'sm' | 'lg';
  className?: string;
};

const TYPE_COVER =
  'flex h-full w-full bg-[hsl(var(--cover-hue)_var(--cover-sat)_var(--cover-bg-l))] font-serif text-[hsl(var(--cover-hue)_var(--cover-sat)_var(--cover-fg-l))]';

/**
 * The save's image, or a typographic cover (domain on a tint derived from it) when it
 * has none or the image fails to load.
 */
export function BookmarkCover({ bookmark, size, className }: BookmarkCoverProps) {
  const src = bookmark.imageUrl.trim();
  // Remember which URL failed, so a refreshed image URL gets another try.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const domain = bookmark.domain.replace(/^www\./, '') || '?';
  const showImage = src !== '' && failedSrc !== src;

  // Not a link of its own: the title link stretches over the whole row or tile.
  return (
    <div
      className={cn('overflow-hidden bg-muted', className)}
      style={{ '--cover-hue': coverHue(domain) } as React.CSSProperties}
    >
      {showImage ? (
        // unoptimized: covers come from any site a user saves, so the browser loads them
        // directly. Optimizing would make this server fetch and resize arbitrary
        // third-party images and need a wildcard images.remotePatterns. width/height only
        // reserve the aspect ratio; the classes size it.
        <Image
          src={src}
          alt=""
          width={600}
          height={400}
          unoptimized
          onError={() => setFailedSrc(src)}
          className="h-full w-full object-cover"
        />
      ) : size === 'sm' ? (
        <span
          className={cn(TYPE_COVER, 'items-center justify-center text-[1.75rem] font-semibold')}
        >
          {domain.charAt(0).toUpperCase()}
        </span>
      ) : (
        <span className={cn(TYPE_COVER, 'items-end p-4 text-[1.375rem] font-medium leading-tight')}>
          <span className="line-clamp-2 break-all">{domain}</span>
        </span>
      )}
    </div>
  );
}
