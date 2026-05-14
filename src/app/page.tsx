import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex-grow flex items-center justify-center px-6 py-20">
      <div className="max-w-xl text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-red-500 text-white mb-6 text-xl font-bold">
          P
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">Pocket</h1>
        <p className="text-gray-600 mb-8">
          Save articles, videos, and links from the web — and come back to them later.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/saves"
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm"
          >
            Open your saves
          </Link>
        </div>
        <p className="mt-8 text-xs text-gray-400">
          Marketing landing page, login, and registration are still TODO — see CLAUDE.md.
        </p>
      </div>
    </main>
  );
}
