import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const ToastContainer = useCallback(() => {
    return (
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-xl border
                ${t.type === 'success' ? 'bg-green-500/90 border-green-400/50 text-white' : ''}
                ${t.type === 'error' ? 'bg-red-500/90 border-red-400/50 text-white' : ''}
                ${t.type === 'info' ? 'bg-blue-500/90 border-blue-400/50 text-white' : ''}
              `}
            >
              {t.type === 'success' && <CheckCircle size={18} />}
              {t.type === 'error' && <AlertCircle size={18} />}
              {t.type === 'info' && <Info size={18} />}
              <span className="font-medium">{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                className="ml-2 p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  }, [toasts, dismiss]);

  return { toast, ToastContainer };
}
