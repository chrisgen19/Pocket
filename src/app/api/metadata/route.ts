import { NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchLinkMetadata } from '@/features/saves/metadata';

const querySchema = z.object({ url: z.string().url() });

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({ url: searchParams.get('url') });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }
  const metadata = await fetchLinkMetadata(parsed.data.url);
  return NextResponse.json(metadata);
}
