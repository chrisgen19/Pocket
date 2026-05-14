import { headers } from 'next/headers';
import { auth } from './auth';

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireUserId(): Promise<string> {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Response('Unauthorized', { status: 401 });
  }
  return session.user.id;
}
