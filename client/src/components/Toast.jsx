import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    const newToast = { id, message, type, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 pointer-events-none max-w-sm w-full px-4">
        {toasts.map((toast) => {
          let bgStyle = 'border-white/20 text-white';
          let icon = <Info size={18} className="text-blue-400 shrink-0" />;

          if (toast.type === 'success') {
            bgStyle = 'border-emerald-500/30 text-emerald-100';
            icon = <CheckCircle size={18} className="text-emerald-400 shrink-0" />;
          } else if (toast.type === 'error') {
            bgStyle = 'border-rose-500/40 text-rose-100';
            icon = <AlertCircle size={18} className="text-rose-400 shrink-0" />;
          } else if (toast.type === 'warning') {
            bgStyle = 'border-amber-500/30 text-amber-100';
            icon = <AlertTriangle size={18} className="text-amber-400 shrink-0" />;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl glass-strong shadow-2xl backdrop-blur-xl border transition-all animate-fadeIn ${bgStyle}`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                {icon}
                <span className="text-sm font-medium leading-snug break-words">
                  {toast.message}
                </span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-white/60 hover:text-white p-1 rounded-lg transition-colors shrink-0"
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
  const context = useContext(ToastContext);
  if (!context) {
    // Return fallback in case component used outside provider
    return {
      showToast: (msg) => console.log('[Toast fallback]:', msg)
    };
  }
  return context;
}
