import { NextResponse } from 'next/server';
import { updateBookmarkSchema } from '@/features/saves/schemas';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
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
    where: { id, userId: session.user.id },
    data: parsed.data,
  });
  if (updated.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(updated[0]);
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;

  const result = await prisma.bookmark.deleteMany({
    where: { id, userId: session.user.id },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
