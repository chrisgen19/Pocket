'use client';

import { type RefObject, useEffect, useEffectEvent } from 'react';
import { extractLinks } from '@/features/saves/omnibox';

const isEditable = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable || target.closest('input, textarea, select') !== null);

/**
 * Links on the clipboard: from the plain text, or else from the <a href>s of copied
 * HTML (e.g. a selection of links copied from a web page).
 */
export const linksFromClipboard = (data: DataTransfer): string[] => {
  const fromText = extractLinks(data.getData('text/plain'));
  if (fromText.length > 0) return fromText;
  const html = data.getData('text/html');
  if (!html) return [];
  // Parsing only: DOMParser documents don't run scripts or load resources.
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const hrefs = [...doc.querySelectorAll('a[href]')].map((a) => a.getAttribute('href') ?? '');
  return extractLinks(hrefs.join(' '));
};

/**
 * Page-wide shortcuts for the header box: Ctrl/Cmd+K or "/" focus it, and pasting
 * links while no text field has focus puts them in it (without saving).
 */
export const useOmniboxShortcuts = (
  inputRef: RefObject<HTMLInputElement | null>,
  onPasteLinks: (text: string) => void,
) => {
  const onKeyDown = useEffectEvent((e: KeyboardEvent) => {
    const input = inputRef.current;
    if (!input || e.isComposing) return;
    const modifier = e.ctrlKey || e.metaKey;
    if (modifier && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      input.focus();
      input.select();
    } else if (e.key === '/' && !modifier && !e.altKey && !isEditable(e.target)) {
      e.preventDefault();
      input.focus();
    }
  });

  const onPaste = useEffectEvent((e: ClipboardEvent) => {
    if (isEditable(e.target) || !e.clipboardData) return;
    const links = linksFromClipboard(e.clipboardData);
    if (links.length === 0) return;
    e.preventDefault();
    onPasteLinks(links.join(' '));
    inputRef.current?.focus();
  });

  useEffect(() => {
    const keydown = (e: KeyboardEvent) => onKeyDown(e);
    const paste = (e: ClipboardEvent) => onPaste(e);
    document.addEventListener('keydown', keydown);
    document.addEventListener('paste', paste);
    return () => {
      document.removeEventListener('keydown', keydown);
      document.removeEventListener('paste', paste);
    };
  }, []);
};
