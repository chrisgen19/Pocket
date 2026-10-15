import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Omnibox } from './omnibox';
import { UserMenu } from './user-menu';

/**
 * Sticky header for the saves pages. From md up the box lines up with the list column
 * (the logo column matches the sidebar width and gap); on phones it gets its own row.
 */
export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b bg-card">
      <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2.5 px-4 py-3 sm:px-6 md:h-16 md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-x-10 md:py-0 lg:px-8">
        <Link
          href="/saves"
          aria-label="Pocket home"
          className="justify-self-start rounded-md md:w-48 lg:w-56"
        >
          <Logo />
        </Link>
        <div className="col-span-2 row-start-2 md:col-span-1 md:col-start-2 md:row-start-1 md:max-w-[55rem]">
          <Omnibox />
        </div>
        <div className="col-start-2 row-start-1 justify-self-end md:col-start-3">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
