import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/session';

/**
 * Every saved URL of the caller, archived ones included. The extension caches this
 * list to mark saved pages on its toolbar icon without sending browsed URLs here.
 */
export async function GET() {
  const { userId, response } = await authenticateRequest();
  if (response) return response;
  const rows = await prisma.bookmark.findMany({
    where: { userId },
    select: { url: true },
  });
  return NextResponse.json(rows.map((row) => row.url));
}
