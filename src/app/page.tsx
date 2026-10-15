import Link from 'next/link';
import { Logo } from '@/components/logo';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function HomePage() {
  return (
    <main className="flex flex-grow items-center justify-center px-6 py-20">
      <div className="max-w-xl">
        <Logo className="mb-8" />
        <h1 className="mb-4 font-serif text-4xl leading-tight font-semibold tracking-[-0.01em]">
          Save it now, read it later.
        </h1>
        <p className="mb-8 text-muted-foreground">
          Save articles, videos, and links from the web, and come back to them later.
        </p>
        <Link
          href="/saves"
          className={cn(buttonVariants(), 'h-10 px-5 text-sm hover:bg-primary/90')}
        >
          Open your saves
        </Link>
        <p className="mt-8 text-xs text-muted-foreground">
          Marketing landing page is still TODO, see CLAUDE.md.
        </p>
      </div>
    </main>
  );
}
