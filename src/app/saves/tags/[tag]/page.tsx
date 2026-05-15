import { notFound } from 'next/navigation';
import { SavesView } from '@/components/saves/saves-view';
import { ToastViewport } from '@/components/saves/toast-viewport';

type Props = {
  params: Promise<{ tag: string }>;
};

export default async function SavesTagPage({ params }: Props) {
  const { tag } = await params;

  // decodeURIComponent throws URIError on malformed % sequences (e.g. "%ZZ"
  // or a trailing "%"). A malformed URL isn't a valid tag — render a real
  // 404 rather than silently falling through to the unfiltered list.
  let decoded: string;
  try {
    decoded = decodeURIComponent(tag);
  } catch {
    notFound();
  }

  return (
    <>
      <SavesView initialTag={decoded} />
      <ToastViewport />
    </>
  );
}
