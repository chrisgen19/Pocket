'use client';

import { Tag } from 'lucide-react';
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
  const matches = useMemo(() => filterSuggestions(suggestions, current, value), [
    suggestions,
    current,
    value,
  ]);

  useEffect(() => setActiveIdx(0), [current]);

  function commit(tag: string) {
    const next = `${before}${tag}, `;
    onChange(next);
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
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Tag className="w-4 h-4 text-gray-400" />
      </div>
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder ?? 'Tags (comma separated)...'}
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
        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 sm:text-sm disabled:opacity-60"
      />
      {open && matches.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {matches.map((tag, i) => (
            <li key={tag}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commit(tag)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                  i === activeIdx ? 'bg-red-50 text-red-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Tag className="size-3 text-gray-400" />
                {tag}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Split the tag string at the cursor's last comma so we know which token is being typed.
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
    .slice(0, 8);
}
