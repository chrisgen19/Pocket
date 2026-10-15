'use client';

import { Link as LinkIcon, Loader2, Plus } from 'lucide-react';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { useCreateBookmark } from '@/features/saves/hooks';
import { createBookmarkSchema } from '@/features/saves/schemas';
import { useToastStore } from '@/features/saves/toast-store';
import { parseTags } from '@/features/saves/utils';
import { TagInput } from './tag-input';

export type AddBookmarkFormHandle = {
  focus: () => void;
};

type AddBookmarkFormProps = {
  tagSuggestions?: string[];
};

export const AddBookmarkForm = forwardRef<AddBookmarkFormHandle, AddBookmarkFormProps>(
  function AddBookmarkForm({ tagSuggestions = [] }, ref) {
    const urlRef = useRef<HTMLInputElement>(null);
    const [url, setUrl] = useState('');
    const [tags, setTags] = useState('');
    const createMutation = useCreateBookmark();
    const showToast = useToastStore((s) => s.show);

    useImperativeHandle(ref, () => ({
      focus: () => {
        urlRef.current?.focus();
        urlRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      },
    }));

    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      const raw = url.trim();
      if (!raw) return;

      // Same rules as the server: bare domains get https://, only http(s) is allowed.
      const parsedUrl = createBookmarkSchema.shape.url.safeParse(raw);
      if (!parsedUrl.success) {
        showToast('Enter a web address, like example.com or https://example.com/page');
        urlRef.current?.focus();
        return;
      }

      try {
        await createMutation.mutateAsync({ url: parsedUrl.data, tags: parseTags(tags) });
        setUrl('');
        setTags('');
      } catch {
        // toast already shown by the hook
      } finally {
        urlRef.current?.focus();
      }
    }

    const submitting = createMutation.isPending;

    return (
      <div className="mb-6 rounded-xl border bg-card p-3">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-grow relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LinkIcon className="size-4 text-muted-foreground" />
            </div>
            <input
              ref={urlRef}
              // Text, not type="url": the browser's url check rejects bare domains like
              // example.com, which the schema accepts by adding https://.
              type="text"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              aria-label="URL to save"
              required
              placeholder="Save a URL, e.g. example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={submitting}
              autoComplete="off"
              className="block h-11 w-full rounded-lg border border-input bg-background pr-3 pl-10 text-base placeholder:text-muted-foreground disabled:opacity-60 sm:text-sm"
            />
          </div>
          <div className="flex-grow sm:max-w-xs">
            <TagInput
              value={tags}
              onChange={setTags}
              suggestions={tagSuggestions}
              disabled={submitting}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Save
              </>
            )}
          </button>
        </form>
      </div>
    );
  },
);
