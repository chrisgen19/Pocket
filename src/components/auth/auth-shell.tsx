import { Bookmark } from 'lucide-react';
import Link from 'next/link';

type AuthShellProps = {
  title: string;
  subtitle: string;
  footer: React.ReactNode;
  children: React.ReactNode;
};

export function AuthShell({ title, subtitle, footer, children }: AuthShellProps) {
  return (
    <main className="flex-grow flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 bg-red-500 rounded text-white flex items-center justify-center">
            <Bookmark className="w-5 h-5" fill="currentColor" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-gray-900">Pocket</span>
        </Link>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">{footer}</p>
      </div>
    </main>
  );
}
