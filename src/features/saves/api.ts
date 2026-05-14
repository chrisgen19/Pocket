import type { Bookmark, CreateBookmarkInput, UpdateBookmarkInput } from './types';

type BookmarkDTO = Omit<Bookmark, 'dateAdded'> & { createdAt: string; updatedAt: string };

function toBookmark(dto: BookmarkDTO): Bookmark {
  return {
    id: dto.id,
    url: dto.url,
    title: dto.title,
    domain: dto.domain,
    excerpt: dto.excerpt,
    imageUrl: dto.imageUrl,
    tags: dto.tags,
    isFavorite: dto.isFavorite,
    isArchived: dto.isArchived,
    dateAdded: new Date(dto.createdAt).getTime(),
  };
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export async function listBookmarks(): Promise<Bookmark[]> {
  const res = await fetch('/api/bookmarks', { credentials: 'include' });
  const dtos = await handle<BookmarkDTO[]>(res);
  return dtos.map(toBookmark);
}

export async function createBookmark(input: CreateBookmarkInput): Promise<Bookmark> {
  const res = await fetch('/api/bookmarks', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return toBookmark(await handle<BookmarkDTO>(res));
}

export async function updateBookmark(
  id: string,
  patch: UpdateBookmarkInput,
): Promise<Bookmark> {
  const res = await fetch(`/api/bookmarks/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  return toBookmark(await handle<BookmarkDTO>(res));
}

export async function deleteBookmark(id: string): Promise<void> {
  const res = await fetch(`/api/bookmarks/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  await handle<{ ok: true }>(res);
}
