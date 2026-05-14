'use client';

import { Link as LinkIcon, Loader2, Plus, Tag } from 'lucide-react';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { useSavesStore } from '@/features/saves/store';
import { useToastStore } from '@/features/saves/toast-store';
import { normalizeUrl, parseTags } from '@/features/saves/utils';

export type AddBookmarkFormHandle = {
  focus: () => void;
};

export const AddBookmarkForm = forwardRef<AddBookmarkFormHandle>(
  function AddBookmarkForm(_props, ref) {
    const urlRef = useRef<HTMLInputElement>(null);
    const [url, setUrl] = useState('');
    const [tags, setTags] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const addBookmark = useSavesStore((s) => s.addBookmark);
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

      setSubmitting(true);
      try {
        // Simulated metadata fetch — replace with real backend call later.
        await new Promise((resolve) => setTimeout(resolve, 600));
        addBookmark({ url: normalizeUrl(raw), tags: parseTags(tags) });
        showToast('URL Saved successfully');
        setUrl('');
        setTags('');
      } catch {
        showToast('Failed to save URL');
      } finally {
        setSubmitting(false);
        urlRef.current?.focus();
      }
    }

    return (
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-8">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-grow relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LinkIcon className="w-4 h-4 text-gray-400" />
            </div>
            <input
              ref={urlRef}
              type="url"
              required
              placeholder="Save a URL..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={submitting}
              autoComplete="off"
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 sm:text-sm disabled:opacity-60"
            />
          </div>
          <div className="flex-grow relative sm:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Tag className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Tags (comma separated)..."
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              disabled={submitting}
              autoComplete="off"
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 sm:text-sm disabled:opacity-60"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white px-6 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-sm flex items-center justify-center gap-2"
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
