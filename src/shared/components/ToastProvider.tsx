import { createContext, ReactNode, useCallback, useContext, useState } from 'react';

type Toast = { id: string; message: string; type?: 'success' | 'error' | 'info' };

const ToastContext = createContext<{
  toasts: Toast[];
  addToast: (message: string, type?: Toast['type']) => void;
} | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);
  return (
    <ToastContext.Provider value={{ toasts, addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-2 rounded-lg shadow-lg ${
              t.type === 'success'
                ? 'bg-emerald-600'
                : t.type === 'error'
                  ? 'bg-red-600'
                  : 'bg-slate-700'
            } text-white text-sm`}
            role="alert"
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.addToast;
}
