'use client';

import { create } from 'zustand';

export type ToastAction = {
  label: string;
  onAction: () => void;
};

export type Toast = {
  id: string;
  message: string;
  action?: ToastAction;
};

type ToastState = {
  toasts: Toast[];
  show: (message: string, action?: ToastAction) => void;
  dismiss: (id: string) => void;
};

const TOAST_MS = 3000;
// Longer when there is something to click, e.g. Undo.
const ACTION_TOAST_MS = 6000;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: (message, action) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    set((s) => ({ toasts: [...s.toasts, { id, message, action }] }));
    setTimeout(
      () => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      },
      action ? ACTION_TOAST_MS : TOAST_MS,
    );
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
