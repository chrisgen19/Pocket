'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

type NewKeyNoticeProps = {
  apiKey: string;
  /** Shared iCloud link of the "Save to Pocket" shortcut, offered after copying. */
  shortcutUrl?: string;
  onDismiss: () => void;
};

// The raw key is only returned once at creation (the database stores a hash), so it
// has to be copied now.
export function NewKeyNotice({ apiKey, shortcutUrl, onDismiss }: NewKeyNoticeProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
    } catch {
      // Clipboard can be blocked; the key stays selectable in the field below.
      setCopied(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg bg-notice p-4 text-notice-foreground">
      <p className="text-sm font-medium">
        Copy your new key now. For security it won't be shown again.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          readOnly
          value={apiKey}
          onFocus={(e) => e.currentTarget.select()}
          aria-label="New API key"
          className="h-10 min-w-0 flex-grow rounded-lg border border-notice-foreground/30 bg-card px-3 font-mono text-xs text-foreground"
        />
        <button
          type="button"
          onClick={copy}
          className="flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-4 text-sm font-medium text-background hover:bg-foreground/85"
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-sm text-sm underline underline-offset-2 hover:opacity-80"
        >
          I've saved it
        </button>
        {shortcutUrl && (
          <a
            href={shortcutUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-sm text-sm font-medium underline underline-offset-2 hover:opacity-80"
          >
            Add the shortcut to your iPhone
          </a>
        )}
      </div>
    </div>
  );
}
