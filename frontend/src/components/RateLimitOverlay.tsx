import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface RateLimitOverlayProps {
  isActive: boolean;
  message?: string;
  autoRetrySeconds?: number;
  countdown?: number;
  onRetry?: () => void;
}

export function RateLimitOverlay({
  isActive,
  message = '请求频率过快，正在重新加载...',
  autoRetrySeconds = 30,
  countdown: externalCountdown,
  onRetry
}: RateLimitOverlayProps) {
  const [internalCountdown, setInternalCountdown] = useState(autoRetrySeconds);
  const countdown = externalCountdown ?? internalCountdown;

  useEffect(() => {
    if (isActive) {
      setInternalCountdown(autoRetrySeconds);
    }
  }, [isActive, autoRetrySeconds]);

  useEffect(() => {
    if (!isActive || countdown <= 0) return;

    const timer = setInterval(() => {
      setInternalCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onRetry?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, countdown, onRetry]);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-md bg-black/60"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-[#1A1D21] rounded-3xl p-10 shadow-2xl max-w-md mx-4 text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-white animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {message}
            </h2>

            <p className="text-gray-500 dark:text-gray-400 mb-6">
              系统检测到请求频率异常，这是正常的保护机制
            </p>

            <div className="flex items-center justify-center gap-4">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${(countdown / autoRetrySeconds) * 175.9} 175.9`}
                    className="text-orange-500 transition-all duration-1000"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-orange-500">
                  {countdown}
                </span>
              </div>

              <span className="text-gray-400 text-sm">秒后自动重试</span>
            </div>

            <button
              onClick={onRetry}
              className="mt-6 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              立即重试
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default RateLimitOverlay;