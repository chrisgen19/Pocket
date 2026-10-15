'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

type NewKeyNoticeProps = {
  apiKey: string;
  onDismiss: () => void;
};

// The raw key is only returned once at creation (the database stores a hash), so it
// has to be copied now.
export function NewKeyNotice({ apiKey, onDismiss }: NewKeyNoticeProps) {
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
    <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-medium text-amber-900">
        Copy your new key now. For security it won't be shown again.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          readOnly
          value={apiKey}
          onFocus={(e) => e.currentTarget.select()}
          aria-label="New API key"
          className="min-w-0 flex-grow rounded-md border border-amber-300 bg-white px-3 py-2 font-mono text-xs text-gray-900"
        />
        <button
          type="button"
          onClick={copy}
          className="flex items-center justify-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-sm text-amber-900 underline underline-offset-2 hover:text-amber-700"
      >
        I've saved it
      </button>
    </div>
  );
}
