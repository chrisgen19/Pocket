'use client';

import { Link2, Search, X } from 'lucide-react';
import { useId, useRef, useState, useSyncExternalStore } from 'react';
import { useBookmarks, useSaveLinks } from '@/features/saves/hooks';
import { classifyInput, extractLinks } from '@/features/saves/omnibox';
import { useSavesStore } from '@/features/saves/store';
import { OmniboxPanel } from './omnibox-panel';
import { linksFromClipboard, useOmniboxShortcuts } from './use-omnibox-shortcuts';
import { useTagSuggestions } from './use-saves-nav';

// Platform never changes, so there is nothing to subscribe to. The server snapshot
// (false) keeps hydration stable; Apple devices switch to the symbol after it.
const subscribe = () => () => {};
const isApple = () => /Mac|iPhone|iPad/.test(navigator.platform);

// Collapses whitespace: an <input> drops newlines, which would glue pasted links together.
const oneLine = (text: string) => text.replace(/\s+/g, ' ').trimStart();

/** The header box: paste a link and press Enter to save it, or type words to search. */
export function Omnibox() {
  const draft = useSavesStore((s) => s.draft);
  const setDraft = useSavesStore((s) => s.setDraft);
  const [tags, setTags] = useState<string[]>([]);
  // Focus is somewhere in the box or its panel.
  const [active, setActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const summaryId = useId();
  const { save } = useSaveLinks();
  const { data: bookmarks = [] } = useBookmarks();
  const tagSuggestions = useTagSuggestions();
  const apple = useSyncExternalStore(subscribe, isApple, () => false);

  const intent = classifyInput(draft);
  const isLink = intent.kind === 'link' || intent.kind === 'links';
  const showPanel = active && (isLink || intent.kind === 'invalid');

  useOmniboxShortcuts(inputRef, (text) => setDraft(oneLine(text)));

  function clear() {
    setDraft('');
    setTags([]);
  }

  function submit() {
    if (intent.kind === 'link') save([intent.url], tags);
    else if (intent.kind === 'links') save(intent.urls, tags);
    else return;
    clear();
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // 229: Safari reports IME composition keys this way.
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    } else if (e.key === 'Escape') {
      if (draft) clear();
      else e.currentTarget.blur();
    }
  }

  function onPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData('text/plain');
    // One line with at most one link pastes as usual.
    if (!/[\r\n]/.test(text) && extractLinks(text).length < 2) return;
    e.preventDefault();
    const links = linksFromClipboard(e.clipboardData);
    const input = e.currentTarget;
    const start = input.selectionStart ?? draft.length;
    const end = input.selectionEnd ?? draft.length;
    const inserted = links.length > 0 ? links.join(' ') : text;
    setDraft(oneLine(`${draft.slice(0, start)} ${inserted} ${draft.slice(end)}`));
  }

  return (
    <search
      className="relative block w-full"
      onFocus={() => setActive(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setActive(false);
      }}
    >
      <div className="relative">
        {isLink ? (
          <Link2 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-primary" />
        ) : (
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          aria-label="Paste a link to save, or search your saves"
          aria-keyshortcuts="Control+K Meta+K /"
          aria-describedby={showPanel ? summaryId : undefined}
          placeholder="Paste a link or search your saves"
          enterKeyHint={isLink ? 'go' : 'search'}
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="h-10 w-full rounded-lg border border-input bg-background pr-16 pl-9 text-base placeholder:text-muted-foreground focus:bg-card md:text-sm"
        />
        {draft ? (
          <button
            type="button"
            aria-label="Clear"
            onClick={() => {
              clear();
              inputRef.current?.focus();
            }}
            className="absolute top-1/2 right-1.5 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        ) : (
          <kbd className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border bg-card px-1.5 py-0.5 font-sans text-[0.6875rem] text-muted-foreground md:block">
            {apple ? '⌘K' : 'Ctrl K'}
          </kbd>
        )}
      </div>
      {showPanel && (
        <OmniboxPanel
          intent={intent}
          tags={tags}
          onTagsChange={setTags}
          tagSuggestions={tagSuggestions}
          bookmarks={bookmarks}
          summaryId={summaryId}
          onSubmit={submit}
          onEscape={() => inputRef.current?.focus()}
        />
      )}
    </search>
  );
}
