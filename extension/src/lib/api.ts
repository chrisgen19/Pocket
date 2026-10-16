import { type CreateBookmarkInput, createBookmarkSchema } from '@/shared/schemas';
import { API_BASE_URL } from './config';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    const err = new Error(body?.error ?? `Request failed: ${res.status}`);
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }
  return (await res.json()) as T;
}

export type SessionResponse = {
  user?: { id: string; email: string; name: string };
} | null;

export async function getSession(): Promise<SessionResponse> {
  try {
    return await request<SessionResponse>('/api/auth/get-session');
  } catch {
    return null;
  }
}

export async function listTags(): Promise<string[]> {
  try {
    return await request<string[]>('/api/tags');
  } catch {
    return [];
  }
}

export async function createBookmark(input: CreateBookmarkInput) {
  const parsed = createBookmarkSchema.parse(input);
  return request('/api/bookmarks', {
    method: 'POST',
    body: JSON.stringify(parsed),
  });
}

/** Every URL the user has saved, or null when signed out. Throws on other failures. */
export async function listSavedUrls(): Promise<string[] | null> {
  try {
    return await request<string[]>('/api/bookmarks/urls');
  } catch (err) {
    if ((err as Error & { status?: number }).status === 401) return null;
    throw err;
  }
}

export type SavedBookmark = {
  id: string;
  url: string;
  createdAt: string;
  tags: string[];
  isArchived: boolean;
};

/** The user's save of exactly this URL, or null when there is none. Throws on failure. */
export async function findBookmarkByUrl(url: string): Promise<SavedBookmark | null> {
  const rows = await request<SavedBookmark[]>(`/api/bookmarks?url=${encodeURIComponent(url)}`);
  // Match the URL rather than trusting the first row: a server without `?url=` support
  // ignores it and returns the whole list, whose first row is just the newest save.
  return rows.find((row) => row.url === url) ?? null;
}
