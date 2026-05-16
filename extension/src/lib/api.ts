import { API_BASE_URL } from './config';
import { createBookmarkSchema, type CreateBookmarkInput } from '@/shared/schemas';

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
