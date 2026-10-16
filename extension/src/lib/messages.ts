/** Sent by the popup after a save or its lookup: whether `url` is saved. */
export type SavedStateMessage = { type: 'saved-state'; url: string; saved: boolean };

export const isSavedStateMessage = (message: unknown): message is SavedStateMessage =>
  typeof message === 'object' &&
  message !== null &&
  (message as { type?: unknown }).type === 'saved-state' &&
  typeof (message as { url?: unknown }).url === 'string' &&
  typeof (message as { saved?: unknown }).saved === 'boolean';

/** Tells the service worker, so the toolbar icon updates without a refresh. */
export const reportSavedState = (url: string, saved: boolean): void => {
  const message: SavedStateMessage = { type: 'saved-state', url, saved };
  chrome.runtime.sendMessage(message).catch(() => {
    // The worker is restarting; the next refresh corrects the icon.
  });
};
