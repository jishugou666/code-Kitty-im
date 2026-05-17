import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, ChevronRight, User, Lock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export function StudioAdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/studio/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (data.code === 200) {
        localStorage.setItem('studio_admin_token', data.data.token);
        localStorage.setItem('studio_admin_user', JSON.stringify(data.data));
        navigate('/studio/admin/dashboard');
      } else {
        setError(data.message || '登录失败');
      }
    } catch (err) {
      setError('网络错误，请检查后端服务');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-slate-900 via-[#0E1116] to-slate-800 flex flex-col relative overflow-hidden">
      <div className="absolute top-[15%] left-[15%] w-[400px] h-[400px] bg-[#007AFF]/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[15%] right-[15%] w-[400px] h-[400px] bg-[#5856D6]/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="flex-1 flex items-center justify-center px-4 z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          <button
            onClick={() => navigate('/studio')}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">返回工作室</span>
          </button>

          <div className="w-20 h-20 bg-gradient-to-tr from-[#007AFF] to-[#5856D6] rounded-2xl shadow-[0_12px_40px_rgba(0,122,255,0.3)] flex items-center justify-center mb-8 border border-white/10">
            <Shield size={36} className="text-white" />
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-white mb-3">
            工作室后台管理
          </h1>
          <p className="text-[16px] text-slate-400 mb-12">
            登录以管理工作室官网内容
          </p>

          <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-2xl rounded-[36px] p-8 shadow-[0_16px_64px_rgba(0,0,0,0.2)] border border-white/10">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
              >
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </motion.div>
            )}

            <div className="space-y-5">
              <div className="relative group">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#007AFF] transition-colors">
                  <User size={22} strokeWidth={2} />
                </div>
                <input
                  type="text"
                  placeholder="用户名"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-14 pl-14 pr-5 bg-white/5 border border-white/10 rounded-2xl outline-none text-[17px] text-white placeholder:text-slate-500 focus:bg-white/10 focus:border-[#007AFF]/50 focus:shadow-[0_0_0_4px_rgba(0,122,255,0.1)] transition-all"
                  required
                  autoComplete="username"
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#007AFF] transition-colors">
                  <Lock size={22} strokeWidth={2} />
                </div>
                <input
                  type="password"
                  placeholder="密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 pl-14 pr-5 bg-white/5 border border-white/10 rounded-2xl outline-none text-[17px] text-white placeholder:text-slate-500 focus:bg-white/10 focus:border-[#007AFF]/50 focus:shadow-[0_0_0_4px_rgba(0,122,255,0.1)] transition-all"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !username || !password}
              className="mt-8 w-full h-14 bg-[#007AFF] hover:bg-[#006CE0] active:scale-[0.98] transition-all text-white rounded-2xl font-semibold text-[17px] flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(0,122,255,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  登录
                  <ChevronRight size={20} strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-xs text-center text-slate-500 max-w-[280px] leading-relaxed mx-auto">
            Studio Admin Dashboard v1.0
          </p>
        </motion.div>
      </div>
    </div>
  );
}
