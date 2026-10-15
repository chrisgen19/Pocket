'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { resetSaveQueue } from '@/features/saves/save-queue-runner';
import { signIn } from '@/lib/auth-client';
import { FormError } from './form-error';

// Reject anything that isn't an app-relative path: bare paths only, no
// protocol schemes (javascript:, data:), no protocol-relative URLs (//host),
// no Windows-style escapes, no CR/LF (header-injection paranoia). Falls back
// to /saves otherwise.
function sanitizeNext(raw: string | null): string {
  if (!raw) return '/saves';
  if (!raw.startsWith('/')) return '/saves';
  if (raw.startsWith('//') || raw.startsWith('/\\')) return '/saves';
  if (/[\r\n]/.test(raw)) return '/saves';
  return raw;
}

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const qc = useQueryClient();
  const next = sanitizeNext(search.get('next'));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await signIn.email({
        email: email.trim().toLowerCase(),
        password,
      });
      if (result.error) {
        setError(result.error.message ?? 'Sign in failed');
        return;
      }
      // Drop any user-scoped queries cached from a previous session in this
      // browser tab so we don't render the previous user's data after a
      // same-browser account swap.
      resetSaveQueue();
      qc.clear();
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
          className="h-10"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting}
          className="h-10"
        />
      </div>

      {error && <FormError>{error}</FormError>}

      <Button type="submit" disabled={submitting} className="h-10 w-full hover:bg-primary/90">
        {submitting && <Loader2 className="animate-spin" />}
        {submitting ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
