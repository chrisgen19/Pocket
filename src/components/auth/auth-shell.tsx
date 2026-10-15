import Link from 'next/link';
import { Logo } from '@/components/logo';

type AuthShellProps = {
  title: string;
  subtitle: string;
  footer: React.ReactNode;
  children: React.ReactNode;
};

export function AuthShell({ title, subtitle, footer, children }: AuthShellProps) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:py-16">
      <div className="w-full max-w-sm">
        <Link href="/" aria-label="Pocket home" className="mb-8 inline-flex rounded-md">
          <Logo />
        </Link>

        <div className="rounded-xl border bg-card p-6 sm:p-8">
          <h1 className="font-serif text-[1.75rem] leading-tight font-semibold tracking-[-0.005em]">
            {title}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">{footer}</p>
      </div>
    </main>
  );
}
