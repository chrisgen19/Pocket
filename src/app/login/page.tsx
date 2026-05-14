import Link from 'next/link';
import { Suspense } from 'react';
import { AuthShell } from '@/components/auth/auth-shell';
import { LoginForm } from '@/components/auth/login-form';

export const metadata = {
  title: 'Sign in · Pocket',
};

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your Pocket account."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-red-600 hover:text-red-700 font-medium">
            Create one
          </Link>
        </>
      }
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
