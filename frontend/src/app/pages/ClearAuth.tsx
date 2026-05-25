import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Trash2, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

export function ClearAuth() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'cleaning' | 'done' | 'error'>('cleaning');
  const [clearedItems, setClearedItems] = useState<string[]>([]);

  useEffect(() => {
    const itemsToClear: string[] = [];
    
    try {
      if (localStorage.getItem('auth-storage')) {
        localStorage.removeItem('auth-storage');
        itemsToClear.push('auth-storage (登录状态)');
      }
      if (localStorage.getItem('token')) {
        localStorage.removeItem('token');
        itemsToClear.push('token (访问令牌)');
      }
      if (localStorage.getItem('user')) {
        localStorage.removeItem('user');
        itemsToClear.push('user (用户信息)');
      }

      sessionStorage.clear();
      itemsToClear.push('sessionStorage (会话缓存)');

      setClearedItems(itemsToClear);
      
      if (itemsToClear.length > 0) {
        setStatus('done');
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2500);
      } else {
        setStatus('done');
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 1500);
      }
    } catch (err) {
      console.error('清理失败:', err);
      setStatus('error');
    }
  }, [navigate]);

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/50 dark:from-[#0E1116] dark:via-[#13161A] dark:to-[#0F141A] flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white/80 dark:bg-[#1C1F26]/80 backdrop-blur-2xl rounded-3xl p-8 shadow-[0_16px_64px_rgba(0,0,0,0.06)] border border-white/60 dark:border-white/5"
      >
        {status === 'cleaning' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
              <RefreshCw size={28} className="text-[#007AFF] animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">正在清理...</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center">正在清除本地登录数据，请稍候</p>
          </div>
        )}

        {status === 'done' && (
          <div className="flex flex-col items-center gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center"
            >
              <CheckCircle size={28} className="text-green-500" />
            </motion.div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">清理完成</h2>
            
            <div className="w-full space-y-2 mt-2">
              {clearedItems.map((item) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 rounded-lg px-3 py-2"
                >
                  <Trash2 size={14} className="text-red-400 flex-shrink-0" />
                  <span>已清除：{item}</span>
                </motion.div>
              ))}
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-2">
              正在跳转到登录页...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
              <AlertTriangle size={28} className="text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">清理失败</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
              自动清理失败，请手动操作：
            </p>
            <ol className="text-sm text-slate-600 dark:text-slate-300 text-left space-y-2 w-full bg-slate-50 dark:bg-white/5 rounded-xl p-4">
              <li>1. 按 F12 打开开发者工具</li>
              <li>2. 切换到 Application（应用）标签</li>
              <li>3. 左侧找到 Local Storage → 点击</li>
              <li>4. 右键点击 → Clear（清空）</li>
              <li>5. 刷新页面重新登录</li>
            </ol>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="mt-4 w-full h-12 bg-[#007AFF] hover:bg-[#006CE0] active:scale-[0.98] transition-all text-white rounded-xl font-semibold text-[15px]"
            >
              前往登录页
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
