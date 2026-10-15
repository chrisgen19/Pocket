'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Bookmark } from '@/features/saves/types';
import { cn } from '@/lib/utils';
import { TagChipsInput } from './tag-chips-input';
import { useTagSuggestions } from './use-saves-nav';

type BookmarkTagsEditorProps = {
  bookmark: Bookmark;
  onSave: (tags: string[]) => void;
  onCancel: () => void;
  className?: string;
};

/** Inline tag editing for one save: chips plus Save tags / Cancel. Escape cancels. */
export function BookmarkTagsEditor({
  bookmark,
  onSave,
  onCancel,
  className,
}: BookmarkTagsEditorProps) {
  const [tags, setTags] = useState(bookmark.tags);
  const suggestions = useTagSuggestions();

  return (
    // z-10: above the title link that stretches over the whole row.
    <div className={cn('relative z-10 flex flex-col gap-2 sm:flex-row sm:items-start', className)}>
      <TagChipsInput
        className="flex-1"
        value={tags}
        onChange={setTags}
        suggestions={suggestions}
        label={`Tags for ${bookmark.title}`}
        autoFocus
        onSubmit={() => onSave(tags)}
        onEscape={onCancel}
      />
      <div className="flex gap-2">
        <Button className="h-10 px-3.5 hover:bg-primary/90" onClick={() => onSave(tags)}>
          Save tags
        </Button>
        <Button variant="ghost" className="h-10 px-3" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
