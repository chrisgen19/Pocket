import { Check, ExternalLink, Loader2, LogIn, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  createBookmark,
  findBookmarkByUrl,
  getSession,
  listTags,
  type SavedBookmark,
  type SessionResponse,
} from '@/lib/api';
import { LOGIN_URL, REGISTER_URL, SAVES_URL } from '@/lib/config';
import { reportSavedState } from '@/lib/messages';
import { Logo } from './logo';
import { SavedNotice } from './saved-notice';
import { TagChipsInput } from './tag-chips-input';

type Status = 'idle' | 'saving' | 'saved' | 'error';

export function Popup() {
  const [session, setSession] = useState<SessionResponse | undefined>(undefined);
  const [tab, setTab] = useState<chrome.tabs.Tab | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [savedBookmark, setSavedBookmark] = useState<SavedBookmark | null>(null);

  useEffect(() => {
    void getSession().then((s) => {
      setSession(s);
      if (s?.user) void listTags().then(setTagSuggestions);
    });
    chrome.tabs.query({ active: true, currentWindow: true }).then(([t]) => setTab(t ?? null));
  }, []);

  // Is this tab already saved? Asked once the session and URL are known. The UI does
  // not wait for it, and a failed lookup just shows no notice.
  const signedIn = Boolean(session?.user);
  const tabUrl = tab?.url ?? '';
  useEffect(() => {
    if (!signedIn || !/^https?:/.test(tabUrl)) return;
    findBookmarkByUrl(tabUrl).then(
      (bookmark) => {
        setSavedBookmark(bookmark);
        reportSavedState(tabUrl, bookmark !== null);
      },
      () => {},
    );
  }, [signedIn, tabUrl]);

  if (session === undefined) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-10 text-muted-foreground">
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
      await createBookmark({ url, tags });
      reportSavedState(url, true);
      setStatus('saved');
      setTimeout(() => window.close(), 700);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save');
    }
  }

  return (
    <Shell>
      <header className="flex items-center justify-between border-b px-4 py-3">
        <Logo />
        <button
          type="button"
          onClick={() => chrome.tabs.create({ url: SAVES_URL })}
          className="rounded-sm text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Open app
        </button>
      </header>

      <div className="space-y-4 p-4">
        {savedBookmark && <SavedNotice bookmark={savedBookmark} />}

        {/* Like the web app's save panel: Save beside the page, tags below. The tag
            suggestions then open under the field without covering or moving Save. */}
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="line-clamp-2 font-serif text-[1.0625rem] leading-6 font-medium">
              {title || 'Untitled page'}
            </div>
            <div className="truncate text-xs text-muted-foreground">{url}</div>
          </div>
          <button
            type="button"
            onClick={onSave}
            disabled={!canSave}
            className="flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === 'saving' && <Loader2 className="size-4 animate-spin" />}
            {status === 'saved' && <Check className="size-4" />}
            {buttonLabel(status, savedBookmark !== null)}
          </button>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-medium">Tags</p>
          <TagChipsInput
            value={tags}
            onChange={setTags}
            suggestions={tagSuggestions}
            label="Tags"
            placeholder="Add tags, then press Enter to save"
            disabled={status === 'saving'}
            onSubmit={onSave}
          />
        </div>

        {status === 'error' && (
          <div
            role="alert"
            className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive"
          >
            {errorMsg}
          </div>
        )}
      </div>
    </Shell>
  );
}

function buttonLabel(status: Status, alreadySaved: boolean): string {
  if (status === 'saved') return 'Saved';
  if (status === 'saving') return 'Saving…';
  return alreadySaved ? 'Update' : 'Save';
}

function AuthGate() {
  return (
    <Shell>
      <header className="border-b px-4 py-3">
        <Logo />
      </header>
      <div className="space-y-4 p-4">
        <div className="space-y-1">
          <h1 className="font-serif text-xl leading-tight font-semibold">Sign in to Pocket</h1>
          <p className="text-xs text-muted-foreground">
            You need an account to save bookmarks from this extension.
          </p>
        </div>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => chrome.tabs.create({ url: LOGIN_URL })}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogIn className="size-4" />
            Sign in
          </button>
          <button
            type="button"
            onClick={() => chrome.tabs.create({ url: REGISTER_URL })}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            <UserPlus className="size-4" />
            Create an account
          </button>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-1 rounded-sm text-xs text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="size-3" />
          I've signed in — retry
        </button>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="w-[360px] bg-card text-foreground">{children}</div>;
}
