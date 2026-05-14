import { NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchLinkMetadata } from '@/features/saves/metadata';
import { getSession } from '@/lib/session';
import { UnsafeUrlError } from '@/lib/url-safety';

const querySchema = z.object({ url: z.string().url() });

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({ url: searchParams.get('url') });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }

  try {
    const metadata = await fetchLinkMetadata(parsed.data.url);
    return NextResponse.json(metadata);
  } catch (err) {
    if (err instanceof UnsafeUrlError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 502 });
  }
}
