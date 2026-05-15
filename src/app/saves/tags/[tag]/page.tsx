import { SavesView } from '@/components/saves/saves-view';
import { ToastViewport } from '@/components/saves/toast-viewport';

type Props = {
  params: Promise<{ tag: string }>;
};

export default async function SavesTagPage({ params }: Props) {
  const { tag } = await params;
  return (
    <>
      <SavesView initialTag={decodeURIComponent(tag)} />
      <ToastViewport />
    </>
  );
}
