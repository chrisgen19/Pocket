'use client';

import { Loader2, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

type AddToIphoneButtonProps = {
  /** Shared iCloud link of the "Save to Pocket" shortcut. */
  shortcutUrl: string;
  /** True while another key is being created, so one tap can't start a second key. */
  disabled?: boolean;
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
export function AddToIphoneButton({ shortcutUrl, disabled, createKey }: AddToIphoneButtonProps) {
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
    <div className="flex flex-col gap-3 rounded-lg border bg-background p-4 sm:flex-row sm:items-center">
      <p className="flex-grow text-sm text-muted-foreground">
        On your iPhone, this creates a key, copies it and opens the Save to Pocket shortcut. Add it,
        then paste the key when Shortcuts asks for it, or into the shortcut's Text action if it
        doesn't ask.
      </p>
      <Button
        onClick={addToIphone}
        disabled={pending || disabled}
        className="h-10 shrink-0 bg-foreground px-4 text-background hover:bg-foreground/85"
      >
        {pending ? <Loader2 className="animate-spin" /> : <Smartphone />}
        Add to iPhone
      </Button>
    </div>
  );
}
