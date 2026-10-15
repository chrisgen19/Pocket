'use client';

import { useEffect } from 'react';
import { isQueueActive, useSaveQueueStore } from '@/features/saves/save-queue-store';

/**
 * Announces save progress to screen readers ("Saving 5 links", "Saved 4 links, 1
 * failed") and warns before leaving the page while saves are still running.
 */
export function SaveQueueStatus() {
  const announcement = useSaveQueueStore((s) => s.announcement);
  const items = useSaveQueueStore((s) => s.items);
  const active = isQueueActive(items);

  useEffect(() => {
    if (!active) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [active]);

  // The region stays mounted; only its content changes, which is what gets announced.
  return (
    <p role="status" className="sr-only">
      <span key={announcement?.id}>{announcement?.text}</span>
    </p>
  );
}
