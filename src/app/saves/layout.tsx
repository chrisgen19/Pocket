import { Navbar } from '@/components/saves/navbar';
import { SaveQueueStatus } from '@/components/saves/save-queue-status';
import { ToastViewport } from '@/components/saves/toast-viewport';

// Shared by /saves, /saves/favorites, /saves/archive and /saves/tags/[tag], so the
// header box (its text and focus), toasts and the save announcer stay mounted while
// moving between them.
export default function SavesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <SaveQueueStatus />
      <ToastViewport />
    </>
  );
}
