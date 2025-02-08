import { useState, useEffect } from 'react';
import { Transition } from './transition';
import { Alert } from './alert';
import { create } from 'zustand';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { ...toast, id: Math.random().toString(36).substr(2, 9) },
      ],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-0 right-0 z-50 m-4 space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

interface ToastProps extends Toast {
  onRemove: () => void;
}

function Toast({ type, message, duration = 5000, onRemove }: ToastProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onRemove, 200);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onRemove]);

  return (
    <Transition show={show} type="slide">
      <Alert type={type} message={message} className="w-72" />
    </Transition>
  );
} 