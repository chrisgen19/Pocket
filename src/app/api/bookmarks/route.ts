import { NextResponse } from 'next/server';
import { fetchLinkMetadata } from '@/features/saves/metadata';
import { createBookmarkSchema } from '@/features/saves/schemas';
import { normalizeUrl } from '@/features/saves/utils';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { UnsafeUrlError } from '@/lib/url-safety';

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(bookmarks);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createBookmarkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const url = normalizeUrl(parsed.data.url);

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
  // and merges new tags into the existing set.
  const existing = await prisma.bookmark.findUnique({
    where: { userId_url: { userId: session.user.id, url } },
    select: { tags: true },
  });
  const mergedTags = existing
    ? Array.from(new Set([...existing.tags, ...parsed.data.tags]))
    : parsed.data.tags;

  const bookmark = await prisma.bookmark.upsert({
    where: { userId_url: { userId: session.user.id, url } },
    create: {
      userId: session.user.id,
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
