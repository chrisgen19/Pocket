'use client';

import { useToastStore } from '@/features/saves/toast-store';

export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  return (
    // Always mounted so screen readers pick up toasts added to the live region.
    <div aria-live="polite" className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-4 bg-gray-700 text-white px-6 py-3 rounded-lg shadow-md animate-in fade-in slide-in-from-bottom-2"
        >
          <span>{t.message}</span>
          {t.action && (
            <button
              type="button"
              onClick={() => {
                dismiss(t.id);
                t.action?.onAction();
              }}
              className="-my-1 rounded px-2 py-1 text-sm font-semibold text-red-300 hover:bg-white/10 hover:text-red-200 focus:outline-none focus:ring-2 focus:ring-red-300"
            >
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
