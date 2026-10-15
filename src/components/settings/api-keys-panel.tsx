'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Loader2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { AddToIphoneButton } from './add-to-iphone-button';
import { NewKeyNotice } from './new-key-notice';

type ApiKeysPanelProps = {
  /** Shared iCloud link of the "Save to Pocket" shortcut; unset hides "Add to iPhone". */
  shortcutUrl?: string;
};

const KEYS_QUERY = ['api-keys'] as const;
const SHORTCUT_KEY_NAME = 'iPhone Shortcut';

const listKeys = async () => {
  const { data, error } = await authClient.apiKey.list();
  if (error) throw new Error(error.message ?? 'Could not load API keys');
  return data.apiKeys;
};

/** Create, list and revoke personal API keys (used by the Apple Shortcuts action). */
export function ApiKeysPanel({ shortcutUrl }: ApiKeysPanelProps) {
  const qc = useQueryClient();
  const [name, setName] = useState(SHORTCUT_KEY_NAME);
  const [newKey, setNewKey] = useState<string | null>(null);
  const keysQuery = useQuery({ queryKey: KEYS_QUERY, queryFn: listKeys });

  const create = useMutation({
    mutationFn: async (keyName: string) => {
      const { data, error } = await authClient.apiKey.create({ name: keyName });
      if (error) throw new Error(error.message ?? 'Could not create the key');
      return data.key;
    },
    onSuccess: (key) => {
      setNewKey(key);
      qc.invalidateQueries({ queryKey: KEYS_QUERY });
    },
  });

  const revoke = useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await authClient.apiKey.delete({ keyId });
      if (error) throw new Error(error.message ?? 'Could not revoke the key');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS_QUERY }),
  });

  const keys = keysQuery.data ?? [];
  const actionError = create.error ?? revoke.error;

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate(name.trim() || 'API key');
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <label htmlFor="api-key-name" className="sr-only">
          Key name
        </label>
        <input
          id="api-key-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          placeholder="Key name, e.g. iPhone Shortcut"
          className="flex-grow rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-red-500 focus:ring-red-500"
        />
        <button
          type="submit"
          disabled={create.isPending}
          className="flex items-center justify-center gap-2 rounded-lg bg-red-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60"
        >
          {create.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Create key
        </button>
      </form>

      {shortcutUrl && (
        <AddToIphoneButton
          shortcutUrl={shortcutUrl}
          createKey={() => create.mutateAsync(SHORTCUT_KEY_NAME)}
        />
      )}

      {newKey && (
        <NewKeyNotice apiKey={newKey} shortcutUrl={shortcutUrl} onDismiss={() => setNewKey(null)} />
      )}

      {actionError && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError.message}
        </p>
      )}

      {keysQuery.isLoading ? (
        <div className="flex justify-center py-6 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : keysQuery.error ? (
        <p className="text-sm text-red-700">{keysQuery.error.message}</p>
      ) : keys.length === 0 ? (
        <p className="py-4 text-sm text-gray-500">No API keys yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
          {keys.map((k) => (
            <li key={k.id} className="flex items-center gap-3 px-4 py-3">
              <KeyRound className="h-4 w-4 flex-shrink-0 text-gray-400" />
              <div className="min-w-0 flex-grow">
                <p className="truncate text-sm font-medium text-gray-900">{k.name ?? 'API key'}</p>
                <p className="truncate font-mono text-xs text-gray-500">{k.start ?? ''}…</p>
                <p className="text-xs text-gray-500">
                  Created {new Date(k.createdAt).toLocaleDateString()}
                  {k.lastRequest
                    ? `, last used ${new Date(k.lastRequest).toLocaleDateString()}`
                    : ', never used'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      `Revoke "${k.name ?? 'API key'}"? Anything using it stops working.`,
                    )
                  ) {
                    revoke.mutate(k.id);
                  }
                }}
                disabled={revoke.isPending}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
                title="Revoke key"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Revoke</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
