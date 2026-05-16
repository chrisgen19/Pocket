import { useEffect, useMemo, useRef, useState } from 'react';

type Props = {
  value: string;
  onChange: (next: string) => void;
  suggestions: string[];
  disabled?: boolean;
  placeholder?: string;
};

export function TagInput({ value, onChange, suggestions, disabled, placeholder }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const { before, current } = splitAtCursor(value);
  const matches = useMemo(
    () => filterSuggestions(suggestions, current, value),
    [suggestions, current, value],
  );

  useEffect(() => setActiveIdx(0), [current]);

  function commit(tag: string) {
    onChange(`${before}${tag}, `);
    setOpen(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || matches.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % matches.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 + matches.length) % matches.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      commit(matches[activeIdx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder ?? 'read-later, design'}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
        disabled={disabled}
        autoComplete="off"
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
      />
      {open && matches.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-md border border-neutral-200 bg-white py-1 shadow-lg">
          {matches.map((tag, i) => (
            <li key={tag}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commit(tag)}
                className={`block w-full px-3 py-1.5 text-left text-xs ${
                  i === activeIdx ? 'bg-red-50 text-red-700' : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                {tag}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function splitAtCursor(value: string) {
  const lastComma = value.lastIndexOf(',');
  if (lastComma === -1) return { before: '', current: value.trimStart() };
  return {
    before: value.slice(0, lastComma + 1) + (value[lastComma + 1] === ' ' ? '' : ' '),
    current: value.slice(lastComma + 1).trim(),
  };
}

function filterSuggestions(suggestions: string[], current: string, full: string) {
  const already = new Set(
    full
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean),
  );
  const q = current.toLowerCase();
  return suggestions
    .filter((s) => !already.has(s.toLowerCase()) || s.toLowerCase() === q)
    .filter((s) => (q ? s.toLowerCase().includes(q) : true))
    .slice(0, 6);
}
