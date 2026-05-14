import { NextResponse } from 'next/server';
import { fetchLinkMetadata } from '@/features/saves/metadata';
import { createBookmarkSchema } from '@/features/saves/schemas';
import { normalizeUrl } from '@/features/saves/utils';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

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
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });
  }

  const url = normalizeUrl(parsed.data.url);
  const metadata = await fetchLinkMetadata(url);

  const bookmark = await prisma.bookmark.create({
    data: {
      userId: session.user.id,
      url,
      title: metadata.title,
      domain: metadata.domain,
      excerpt: metadata.excerpt,
      imageUrl: metadata.imageUrl,
      tags: parsed.data.tags,
    },
  });

  return NextResponse.json(bookmark, { status: 201 });
}
