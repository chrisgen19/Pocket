'use client';

import { useToastStore } from '@/features/saves/toast-store';

export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  return (
    // Always mounted so screen readers pick up toasts added to the live region.
    // Phones: full width inside 16px gutters, so long messages wrap instead of hitting
    // the screen edge. sm and up: bottom-right, capped width. The container ignores
    // pointer events so it never blocks the page; each toast re-enables them for Undo.
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-stretch gap-2.5 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:items-end"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-center gap-4 rounded-lg bg-gray-700 px-5 py-3 text-white shadow-md animate-in fade-in slide-in-from-bottom-2 sm:max-w-sm sm:px-6"
        >
          <span className="min-w-0 flex-1 break-words">{t.message}</span>
          {t.action && (
            <button
              type="button"
              onClick={() => {
                dismiss(t.id);
                t.action?.onAction();
              }}
              className="-my-1 shrink-0 rounded px-2 py-1 text-sm font-semibold text-red-300 hover:bg-white/10 hover:text-red-200 focus:outline-none focus:ring-2 focus:ring-red-300"
            >
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
