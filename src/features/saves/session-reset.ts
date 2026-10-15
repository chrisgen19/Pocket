'use client';

import { resetSaveQueue } from './save-queue-runner';
import { useSavesStore } from './store';
import { useToastStore } from './toast-store';

/**
 * Clears the tab's per-account client state when the signed-in account changes: the
 * save queue (in-flight saves are aborted), the header box text (a search or unsaved
 * link) and open toasts (an Undo would otherwise act under the next account). The
 * list/grid preference stays: it belongs to the device. Call it before `qc.clear()`.
 */
export const resetSessionState = (): void => {
  resetSaveQueue();
  useSavesStore.getState().setDraft('');
  useToastStore.setState({ toasts: [] });
};
