import { NextResponse } from 'next/server';
import { restoreBookmarkSchema } from '@/features/saves/schemas';
import { isPrismaError, prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

/**
 * POST /api/bookmarks/restore
 *
 * Undo for a delete: re-inserts the row returned by DELETE /api/bookmarks/[id],
 * keeping its id, createdAt, flags and tags. The owner always comes from the
 * session, never the body, so a user can only restore into their own account.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = restoreBookmarkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const bookmark = await prisma.bookmark.create({
      data: {
        ...parsed.data,
        createdAt: new Date(parsed.data.createdAt),
        userId: session.user.id,
      },
    });
    return NextResponse.json(bookmark, { status: 201 });
  } catch (err) {
    // The same URL was saved again (or the id reused) before undo was clicked.
    if (isPrismaError(err, 'P2002')) {
      return NextResponse.json(
        { error: 'This URL was saved again, so it could not be restored' },
        { status: 409 },
      );
    }
    throw err;
  }
}
