import Link from 'next/link';
import { AuthShell } from '@/components/auth/auth-shell';
import { RegisterForm } from '@/components/auth/register-form';

export const metadata = {
  title: 'Create account · Pocket',
};

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Save articles, videos, and links to read later."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="text-red-600 hover:text-red-700 font-medium">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
