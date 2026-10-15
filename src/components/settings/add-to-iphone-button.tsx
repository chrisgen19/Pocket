'use client';

import { Loader2, Smartphone } from 'lucide-react';
import { useState } from 'react';

type AddToIphoneButtonProps = {
  /** Shared iCloud link of the "Save to Pocket" shortcut. */
  shortcutUrl: string;
  /** Creates a new API key and resolves with the raw key. */
  createKey: () => Promise<string>;
};

const toTextBlob = (text: string) => new Blob([text], { type: 'text/plain' });

/**
 * Copies text that is still being fetched. Safari only allows clipboard writes during
 * the tap itself, so it gets a ClipboardItem holding the pending promise; browsers
 * without promise support fall back to writeText once the text arrives.
 */
const copyWhenReady = async (text: Promise<string>): Promise<boolean> => {
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'text/plain': text.then(toTextBlob) })]);
    return true;
  } catch {
    try {
      await navigator.clipboard.writeText(await text);
      return true;
    } catch {
      return false;
    }
  }
};

/** Creates a key, copies it and opens the shared shortcut so the user only has to paste. */
export function AddToIphoneButton({ shortcutUrl, createKey }: AddToIphoneButtonProps) {
  const [pending, setPending] = useState(false);

  async function addToIphone() {
    setPending(true);
    const copied = await copyWhenReady(createKey());
    setPending(false);
    // If creating failed, the panel shows the error. If only the copy failed, the new
    // key notice still shows the key and the shortcut link.
    if (copied) window.location.assign(shortcutUrl);
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-center">
      <p className="flex-grow text-sm text-gray-600">
        On your iPhone, this creates a key, copies it and opens the Save to Pocket shortcut. Paste
        the key when Shortcuts asks for it.
      </p>
      <button
        type="button"
        onClick={addToIphone}
        disabled={pending}
        className="flex flex-shrink-0 items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-60"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Smartphone className="h-4 w-4" />
        )}
        Add to iPhone
      </button>
    </div>
  );
}
