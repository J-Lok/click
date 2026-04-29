import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';
type Toast = { id: string; message: string; type: ToastType };

const MAX_TOASTS = 5;
const AUTO_DISMISS_MS = 5000;

const ToastContext = createContext<{
  addToast: (message: string, type?: ToastType) => void;
} | null>(null);

const TOAST_STYLES: Record<ToastType, string> = {
  success: 'bg-emerald-800 border-emerald-600/50 text-emerald-50',
  error: 'bg-red-800 border-red-600/50 text-red-50',
  info: 'bg-slate-700 border-slate-500/50 text-slate-100',
};

const TOAST_ICONS: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
      setToasts((prev) => {
        const next = [...prev, { id, message, type }];
        return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next;
      });
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((t) => {
          const Icon = TOAST_ICONS[t.type];
          return (
            <div
              key={t.id}
              role="alert"
              className={`toast-enter flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl border pointer-events-auto ${TOAST_STYLES[t.type]}`}
            >
              <Icon size={18} className="shrink-0 mt-0.5 opacity-90" />
              <span className="flex-1 text-sm leading-snug">{t.message}</span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity mt-0.5"
                aria-label="Fermer la notification"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.addToast;
}
