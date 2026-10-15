import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/session';

export async function GET() {
  const { userId, response } = await authenticateRequest();
  if (response) return response;

  // Aggregate distinct tags from the user's bookmarks, sorted by usage frequency.
  const rows = await prisma.$queryRaw<Array<{ tag: string; count: bigint }>>`
    SELECT unnest(tags) AS tag, COUNT(*)::bigint AS count
    FROM bookmarks
    WHERE "userId" = ${userId}
    GROUP BY tag
    ORDER BY count DESC, tag ASC
  `;

  return NextResponse.json(rows.map((r) => r.tag));
}
