import type { Metadata, Viewport } from 'next';
import { Hanken_Grotesk, Newsreader } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

// UI face.
const hanken = Hanken_Grotesk({
  variable: '--font-hanken',
  subsets: ['latin'],
});

// Reading face for saved titles and page titles (variable, with an optical size axis).
const newsreader = Newsreader({
  variable: '--font-newsreader',
  subsets: ['latin'],
  axes: ['opsz'],
});

export const metadata: Metadata = {
  title: 'Pocket',
  description: 'Save articles, videos, and links from the web.',
};

// Matches --paper in shared/tokens.css.
export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f3f4f1' },
    { media: '(prefers-color-scheme: dark)', color: '#12161e' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${hanken.variable} ${newsreader.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
