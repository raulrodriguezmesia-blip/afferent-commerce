import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  addToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} className="text-emerald-400" />;
      case 'error':
        return <XCircle size={18} className="text-rose-400" />;
      case 'warning':
        return <AlertTriangle size={18} className="text-amber-400" />;
      case 'info':
      default:
        return <Info size={18} className="text-blue-400" />;
    }
  };

  const getStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/40 bg-emerald-950/60 text-emerald-200';
      case 'error':
        return 'border-rose-500/40 bg-rose-950/60 text-rose-200';
      case 'warning':
        return 'border-amber-500/40 bg-amber-950/60 text-amber-200';
      case 'info':
      default:
        return 'border-blue-500/40 bg-blue-950/60 text-blue-200';
    }
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md ${getStyles(
              toast.type
            )}`}
          >
            {getIcon(toast.type)}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
