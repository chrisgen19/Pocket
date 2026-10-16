'use client';

import { rankedSuggestions } from '@shared/tag-autocomplete';
import { normalizeTag } from '@shared/tags';
import { useId, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { TagChip, TagSuggestionList } from './tag-chips-parts';

const SUGGESTION_LIMIT = 6;

type TagChipsInputProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
  /** Accessible name of the text field, e.g. "Tags for this link". */
  label: string;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Enter with nothing typed: submit whatever the chips belong to. */
  onSubmit?: () => void;
  /** Escape while no suggestions are open. */
  onEscape?: () => void;
  className?: string;
};

/**
 * Tags as removable chips with suggestions. Comma adds exactly what's typed; Enter or Tab
 * adds the highlighted suggestion (or what's typed); Backspace on an empty field removes
 * the last chip; leaving the field keeps what was typed.
 */
export function TagChipsInput(props: TagChipsInputProps) {
  const { value, onChange, label, disabled, onSubmit, onEscape } = props;
  const listId = useId();
  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const current = draft.trim().toLowerCase();
  const matches = useMemo(
    () => rankedSuggestions(props.suggestions, current, value, SUGGESTION_LIMIT),
    [props.suggestions, current, value],
  );
  const showList = open && matches.length > 0;

  // Highlight the first suggestion again whenever the typed text changes.
  const [prevCurrent, setPrevCurrent] = useState(current);
  if (current !== prevCurrent) {
    setPrevCurrent(current);
    setActiveIdx(0);
  }

  function add(raw: string[]) {
    const next = [...value];
    for (const tag of raw.map(normalizeTag)) if (tag && !next.includes(tag)) next.push(tag);
    if (next.length !== value.length) onChange(next);
    setDraft('');
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing) return;
    if (showList && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActiveIdx((i) => (i + step + matches.length) % matches.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (current) add([showList ? matches[activeIdx] : current]);
      else onSubmit?.();
    } else if (e.key === 'Tab' && current && showList) {
      e.preventDefault();
      add([matches[activeIdx]]);
    } else if (e.key === ',') {
      e.preventDefault();
      add([current]);
    } else if (e.key === 'Backspace' && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    } else if (e.key === 'Escape') {
      if (showList) setOpen(false);
      else onEscape?.();
    }
  }

  function onInputChange(text: string) {
    // Pasted "a, b, c": everything before the last comma becomes chips.
    const parts = text.split(',');
    if (parts.length > 1) add(parts.slice(0, -1));
    setDraft(parts.at(-1) ?? '');
    setOpen(true);
  }

  return (
    <div className={cn('relative', props.className)}>
      {/* A label, so clicking anywhere in the field (not on a chip button) focuses it. */}
      <label className="flex min-h-10 cursor-text flex-wrap items-center gap-1.5 rounded-lg border border-input bg-background px-2 py-1.5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring">
        {value.map((tag) => (
          <TagChip
            key={tag}
            tag={tag}
            disabled={disabled}
            onRemove={() => {
              onChange(value.filter((t) => t !== tag));
              inputRef.current?.focus();
            }}
          />
        ))}
        <input
          ref={inputRef}
          role="combobox"
          aria-label={label}
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList ? `${listId}-${activeIdx}` : undefined}
          value={draft}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            add([current]);
            setOpen(false);
          }}
          placeholder={value.length === 0 ? (props.placeholder ?? 'Add tags') : undefined}
          disabled={disabled}
          // biome-ignore lint/a11y/noAutofocus: only set when the user just chose "Edit tags".
          autoFocus={props.autoFocus}
          autoCapitalize="none"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="done"
          className="min-w-24 flex-1 bg-transparent py-0.5 text-sm outline-none placeholder:text-muted-foreground"
        />
      </label>
      {showList && (
        <TagSuggestionList
          id={listId}
          suggestions={matches}
          activeIdx={activeIdx}
          onPick={(tag) => add([tag])}
        />
      )}
    </div>
  );
}
