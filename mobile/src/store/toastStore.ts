import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  subtitle?: string;
  icon?: string;
  duration?: number;
}

interface ToastState {
  toasts: ToastMessage[];
  show: (toast: Omit<ToastMessage, 'id'>) => void;
  remove: (id: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  show: (toast) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    const duration = toast.duration ?? 4000;
    
    set((state) => {
      // Keep only up to 5 toasts active at absolute maximum to prevent memory issues
      const newToasts = [{ ...toast, id, duration }, ...state.toasts].slice(0, 5);
      return { toasts: newToasts };
    });

    if (duration > 0) {
      setTimeout(() => {
        get().remove(id);
      }, duration);
    }
  },

  remove: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

// Helper function to easily dispatch a toast from anywhere without needing hooks
export const showToast = (options: Omit<ToastMessage, 'id'>) => {
  useToastStore.getState().show(options);
};
