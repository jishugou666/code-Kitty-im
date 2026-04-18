import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Clock, AlertTriangle } from 'lucide-react';

interface RateLimitOverlayProps {
  isVisible: boolean;
  retryAfter?: number;
  reason?: string;
  onRetry: () => void;
}

export function RateLimitOverlay({ isVisible, retryAfter = 10, reason, onRetry }: RateLimitOverlayProps) {
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

  const getReasonText = () => {
    if (reason) return reason;
    return '检测到异常请求行为，请稍后再试';
  };

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
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <ShieldAlert className="w-8 h-8 text-red-500" />
              </div>

              <h2 className="text-xl font-bold text-red-500 mb-2">
                当前已被风控
              </h2>

              <p className="text-sm text-black/60 dark:text-white/60 mb-4">
                {getReasonText()}
              </p>

              <div className="mb-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Clock className="w-5 h-5 text-orange-500" />
                  <span className="text-lg font-semibold text-orange-500">
                    剩余 {countdown} 秒
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-orange-400 to-red-500"
                    initial={{ width: '100%' }}
                    animate={{ width: `${Math.max((countdown / retryAfter) * 100, 0)}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-black/40 dark:text-white/40 mb-4">
                <AlertTriangle size={14} />
                <span>风控期间所有消息将被拦截</span>
              </div>

              <p className="text-xs text-black/40 dark:text-white/40">
                请勿频繁刷新页面或发送消息
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default RateLimitOverlay;
