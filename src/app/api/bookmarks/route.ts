import { normalizeTags } from '@shared/tags';
import { NextResponse } from 'next/server';
import { fetchLinkMetadata } from '@/features/saves/metadata';
import { createBookmarkSchema } from '@/features/saves/schemas';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/session';
import { UnsafeUrlError } from '@/lib/url-safety';

export async function GET(request: Request) {
  const { userId, response } = await authenticateRequest();
  if (response) return response;

  // ?url= looks up one exact URL (the extension popup's "already saved" check) and
  // answers with a 0 or 1 item array, so the response shape stays the same.
  const url = new URL(request.url).searchParams.get('url');
  if (url !== null) {
    const bookmark = await prisma.bookmark.findUnique({
      where: { userId_url: { userId, url } },
    });
    return NextResponse.json(bookmark ? [bookmark] : []);
  }

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(bookmarks);
}

export async function POST(request: Request) {
  const { userId, response } = await authenticateRequest();
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = createBookmarkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  // Already normalized (https:// added to bare domains), http(s)-only and within the
  // length limit restore enforces, by createBookmarkSchema.
  const { url } = parsed.data;

  let metadata: Awaited<ReturnType<typeof fetchLinkMetadata>>;
  try {
    metadata = await fetchLinkMetadata(url);
  } catch (err) {
    if (err instanceof UnsafeUrlError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  // Upsert: re-saving the same URL refreshes metadata, un-archives the entry,
  // and merges new tags into the existing set. Existing tags are normalized too,
  // so rows saved before normalization don't keep "Design" next to "design".
  const existing = await prisma.bookmark.findUnique({
    where: { userId_url: { userId, url } },
    select: { tags: true },
  });
  const mergedTags = existing
    ? normalizeTags([...existing.tags, ...parsed.data.tags])
    : parsed.data.tags;

  const bookmark = await prisma.bookmark.upsert({
    where: { userId_url: { userId, url } },
    create: {
      userId,
      url,
      title: metadata.title,
      domain: metadata.domain,
      excerpt: metadata.excerpt,
      imageUrl: metadata.imageUrl,
      tags: mergedTags,
    },
    update: {
      title: metadata.title,
      domain: metadata.domain,
      excerpt: metadata.excerpt,
      imageUrl: metadata.imageUrl,
      tags: mergedTags,
      isArchived: false,
    },
  });

  return NextResponse.json(bookmark, { status: existing ? 200 : 201 });
}
