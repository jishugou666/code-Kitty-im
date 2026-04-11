import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, AlertTriangle } from 'lucide-react';

interface RateLimitOverlayProps {
  isVisible: boolean;
  retryAfter?: number;
  reason?: string;
  onRetry: () => void;
}

export function RateLimitOverlay({ isVisible, retryAfter = 5, reason, onRetry }: RateLimitOverlayProps) {
  const [countdown, setCountdown] = useState(retryAfter);

  useEffect(() => {
    if (isVisible) {
      setCountdown(retryAfter);
    }
  }, [isVisible, retryAfter]);

  useEffect(() => {
    if (!isVisible || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, countdown]);

  useEffect(() => {
    if (countdown === 0 && isVisible) {
      onRetry();
    }
  }, [countdown, isVisible, onRetry]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-[#1A1D21] rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl"
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Shield className="w-8 h-8 text-yellow-500" />
              </div>

              <h2 className="text-xl font-bold text-black dark:text-white mb-2">
                请求过于频繁
              </h2>

              <p className="text-sm text-black/60 dark:text-white/60 mb-4">
                {reason || '检测到异常请求，请稍后再试'}
              </p>

              <div className="mb-6">
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
                    initial={{ width: '100%' }}
                    animate={{ width: `${(countdown / retryAfter) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-sm text-black/60 dark:text-white/60 mt-2">
                  将在 <span className="font-bold text-yellow-500">{countdown}</span> 秒后自动重试...
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-black/40 dark:text-white/40">
                <AlertTriangle size={14} />
                <span>请勿频繁刷新页面</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default RateLimitOverlay;