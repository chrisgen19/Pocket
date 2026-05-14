'use client';

import { create } from 'zustand';

export type Toast = {
  id: string;
  message: string;
};

type ToastState = {
  toasts: Toast[];
  show: (message: string) => void;
  dismiss: (id: string) => void;
};

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: (message) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    set((s) => ({ toasts: [...s.toasts, { id, message }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
