'use client';

import { useToastStore } from '@/features/saves/toast-store';

export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="bg-gray-700 text-white px-6 py-3 rounded-lg shadow-md animate-in fade-in slide-in-from-bottom-2"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
