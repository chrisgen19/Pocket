import { NextResponse } from 'next/server';
import { updateBookmarkSchema } from '@/features/saves/schemas';
import { isPrismaError, prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/session';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const { userId, response } = await authenticateRequest();
  if (response) return response;
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = updateBookmarkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  // Atomic update + read in one query to avoid a TOCTOU race where the row is
  // deleted between updateMany() and a follow-up findUnique().
  const updated = await prisma.bookmark.updateManyAndReturn({
    where: { id, userId },
    data: parsed.data,
  });
  if (updated.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(updated[0]);
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { userId, response } = await authenticateRequest();
  if (response) return response;
  const { id } = await params;

  // delete() (not deleteMany) so the removed row comes back in one query: the
  // client keeps it for the undo toast, which sends it to /api/bookmarks/restore.
  try {
    const bookmark = await prisma.bookmark.delete({
      where: { id, userId },
    });
    return NextResponse.json({ ok: true, bookmark });
  } catch (err) {
    if (isPrismaError(err, 'P2025')) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    throw err;
  }
}
