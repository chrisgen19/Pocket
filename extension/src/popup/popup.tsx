import { Bookmark, Check, ExternalLink, Loader2, LogIn, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createBookmark, getSession, type SessionResponse } from '@/lib/api';
import { LOGIN_URL, REGISTER_URL, SAVES_URL } from '@/lib/config';

type Status = 'idle' | 'saving' | 'saved' | 'error';

export function Popup() {
  const [session, setSession] = useState<SessionResponse | undefined>(undefined);
  const [tab, setTab] = useState<chrome.tabs.Tab | null>(null);
  const [tagsInput, setTagsInput] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    void getSession().then(setSession);
    chrome.tabs.query({ active: true, currentWindow: true }).then(([t]) => setTab(t ?? null));
  }, []);

  if (session === undefined) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-10 text-neutral-500">
          <Loader2 className="size-5 animate-spin" />
        </div>
      </Shell>
    );
  }

  if (!session?.user) return <AuthGate />;

  const url = tab?.url ?? '';
  const title = tab?.title ?? '';
  const canSave = Boolean(url) && /^https?:/.test(url) && status !== 'saving';

  async function onSave() {
    if (!canSave) return;
    setStatus('saving');
    setErrorMsg('');
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      await createBookmark({ url, tags });
      setStatus('saved');
      setTimeout(() => window.close(), 700);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save');
    }
  }

  return (
    <Shell>
      <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        <div className="flex items-center gap-2 font-semibold text-neutral-900">
          <Bookmark className="size-4 text-red-600" />
          Pocket
        </div>
        <button
          type="button"
          onClick={() => chrome.tabs.create({ url: SAVES_URL })}
          className="text-xs text-neutral-500 hover:text-neutral-800"
        >
          Open app
        </button>
      </header>

      <div className="space-y-3 p-4">
        <div className="space-y-1">
          <div className="line-clamp-2 text-sm font-medium text-neutral-900">
            {title || 'Untitled page'}
          </div>
          <div className="truncate text-xs text-neutral-500">{url}</div>
        </div>

        <label className="block space-y-1">
          <span className="text-xs font-medium text-neutral-700">Tags (comma-separated)</span>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="read-later, design"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
          />
        </label>

        {status === 'error' && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">{errorMsg}</div>
        )}

        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === 'saving' && <Loader2 className="size-4 animate-spin" />}
          {status === 'saved' && <Check className="size-4" />}
          {status === 'idle' && <Bookmark className="size-4" />}
          {status === 'error' && <Bookmark className="size-4" />}
          {status === 'saved' ? 'Saved' : status === 'saving' ? 'Saving…' : 'Save to Pocket'}
        </button>
      </div>
    </Shell>
  );
}

function AuthGate() {
  return (
    <Shell>
      <div className="space-y-4 p-5 text-center">
        <div className="flex items-center justify-center">
          <div className="rounded-full bg-red-50 p-3">
            <Bookmark className="size-6 text-red-600" />
          </div>
        </div>
        <div className="space-y-1">
          <h1 className="text-base font-semibold text-neutral-900">Sign in to Pocket</h1>
          <p className="text-xs text-neutral-500">
            You need an account to save bookmarks from this extension.
          </p>
        </div>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => chrome.tabs.create({ url: LOGIN_URL })}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            <LogIn className="size-4" />
            Sign in
          </button>
          <button
            type="button"
            onClick={() => chrome.tabs.create({ url: REGISTER_URL })}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
          >
            <UserPlus className="size-4" />
            Create an account
          </button>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-800"
        >
          <ExternalLink className="size-3" />
          I've signed in — retry
        </button>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="w-[360px] bg-white text-neutral-900">{children}</div>;
}
