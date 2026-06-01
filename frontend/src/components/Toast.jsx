import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: AlertCircle,
};

const colors = {
  success: 'text-emerald-600 bg-emerald-50',
  error: 'text-red-600 bg-red-50',
  info: 'text-sky-600 bg-sky-50',
};

export function ToastContainer({ toasts, onDismiss }) {
  return (
    <div
      className="fixed left-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
      style={{ top: 'max(16px, env(safe-area-inset-top))' }}
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onDismiss }) {
  const Icon = icons[toast.type] || icons.info;

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className="pointer-events-auto glass-strong rounded-2xl p-4 flex items-start gap-3 shadow-lg"
    >
      <div className={`rounded-full p-1.5 ${colors[toast.type] || colors.info}`}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-sm font-semibold text-forest-900">{toast.title}</p>
        )}
        <p className="text-sm text-forest-700 leading-relaxed">{toast.message}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1 rounded-lg hover:bg-forest-100 transition-colors shrink-0"
      >
        <X size={16} className="text-forest-500" />
      </button>
    </motion.div>
  );
}

export function useToast() {
  const [toasts, setToasts] = React.useState([]);

  const addToast = React.useCallback((toast) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const dismissToast = React.useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const success = React.useCallback((message, title) => {
    return addToast({ type: 'success', message, title });
  }, [addToast]);

  const error = React.useCallback((message, title) => {
    return addToast({ type: 'error', message, title });
  }, [addToast]);

  const info = React.useCallback((message, title) => {
    return addToast({ type: 'info', message, title });
  }, [addToast]);

  return { toasts, addToast, dismissToast, success, error, info };
}
