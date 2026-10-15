import { describe, expect, it } from 'vitest';
import { useSaveQueueStore } from '@/features/saves/save-queue-store';
import { resetSessionState } from '@/features/saves/session-reset';
import { useSavesStore } from '@/features/saves/store';
import { useToastStore } from '@/features/saves/toast-store';

describe('resetSessionState', () => {
  it("clears the previous account's draft, toasts and save queue, keeping the view", () => {
    useSavesStore.setState({ draft: 'https://private.example/doc', view: 'grid' });
    useToastStore.getState().show('Deleted', { label: 'Undo', onAction: () => {} });
    useSaveQueueStore.setState({
      items: [{ url: 'https://a.com', tags: [], status: 'error', retryable: true }],
    });

    resetSessionState();

    expect(useSavesStore.getState().draft).toBe('');
    expect(useSavesStore.getState().view).toBe('grid');
    expect(useToastStore.getState().toasts).toEqual([]);
    expect(useSaveQueueStore.getState().items).toEqual([]);
  });
});
