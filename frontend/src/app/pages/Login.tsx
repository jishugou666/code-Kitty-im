import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { AtSign, Lock, ChevronRight, User, Mail } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export function Login() {
  const navigate = useNavigate();
  const { login, register, isLoading, error, clearError } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  const [loginField, setLoginField] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      if (isLogin) {
        await login({ loginField, password });
      } else {
        await register({ password, nickname, email });
      }
      navigate('/');
    } catch (err) {
      console.error(isLogin ? 'Login failed:' : 'Registration failed:', err);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    clearError();
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/50 dark:from-[#0E1116] dark:via-[#13161A] dark:to-[#0F141A] flex flex-col relative overflow-hidden">
      <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="h-20 w-full bg-white/30 dark:bg-[#1A1D21]/30 backdrop-blur-3xl border-b border-white/50 dark:border-white/5 z-10" />

      <div className="flex-1 flex flex-col items-center justify-center px-8 z-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-md flex flex-col items-center"
        >
          <div className="w-24 h-24 bg-gradient-to-tr from-[#007AFF] to-[#5AC8FA] rounded-[28px] shadow-[0_12px_40px_rgba(0,122,255,0.3)] flex items-center justify-center mb-10 overflow-hidden relative border border-white/40 dark:border-white/10">
            <div className="absolute inset-0 bg-white/20 backdrop-blur-sm" />
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-12 h-12 relative z-10"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>

          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-white mb-3">
            {isLogin ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-[16px] mb-12">
            {isLogin ? 'Sign in to continue to Chat' : 'Sign up to get started'}
          </p>

          <form
            onSubmit={handleSubmit}
            className="w-full bg-white/60 dark:bg-[#1C1F26]/60 backdrop-blur-2xl rounded-[36px] p-8 shadow-[0_16px_64px_rgba(0,0,0,0.06)] border border-white/60 dark:border-white/5"
          >
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-5">
              {!isLogin && (
                <>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#007AFF] transition-colors">
                      <User size={22} strokeWidth={2} />
                    </div>
                    <input
                      type="text"
                      placeholder="Nickname (required)"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full h-14 pl-14 pr-5 bg-white/60 dark:bg-[#0E1116]/60 backdrop-blur-xl rounded-2xl outline-none border border-slate-200/50 dark:border-white/5 text-[17px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-[#0E1116] focus:border-[#007AFF]/50 focus:shadow-[0_0_0_4px_rgba(0,122,255,0.1)] transition-all"
                      required
                    />
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#007AFF] transition-colors">
                      <Mail size={22} strokeWidth={2} />
                    </div>
                    <input
                      type="email"
                      placeholder="Email (required)"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-14 pl-14 pr-5 bg-white/60 dark:bg-[#0E1116]/60 backdrop-blur-xl rounded-2xl outline-none border border-slate-200/50 dark:border-white/5 text-[17px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-[#0E1116] focus:border-[#007AFF]/50 focus:shadow-[0_0_0_4px_rgba(0,122,255,0.1)] transition-all"
                      required
                    />
                  </div>
                </>
              )}

              {isLogin && (
                <div className="relative group">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#007AFF] transition-colors">
                    <AtSign size={22} strokeWidth={2} />
                  </div>
                  <input
                    type="text"
                    placeholder="Email or Username"
                    value={loginField}
                    onChange={(e) => setLoginField(e.target.value)}
                    className="w-full h-14 pl-14 pr-5 bg-white/60 dark:bg-[#0E1116]/60 backdrop-blur-xl rounded-2xl outline-none border border-slate-200/50 dark:border-white/5 text-[17px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-[#0E1116] focus:border-[#007AFF]/50 focus:shadow-[0_0_0_4px_rgba(0,122,255,0.1)] transition-all"
                    required
                  />
                </div>
              )}

              <div className="relative group">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#007AFF] transition-colors">
                  <Lock size={22} strokeWidth={2} />
                </div>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 pl-14 pr-5 bg-white/60 dark:bg-[#0E1116]/60 backdrop-blur-xl rounded-2xl outline-none border border-slate-200/50 dark:border-white/5 text-[17px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-[#0E1116] focus:border-[#007AFF]/50 focus:shadow-[0_0_0_4px_rgba(0,122,255,0.1)] transition-all"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-10 w-full h-14 bg-[#007AFF] hover:bg-[#006CE0] active:scale-[0.98] transition-all text-white rounded-2xl font-semibold text-[17px] flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(0,122,255,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Sign Up'}
                  <ChevronRight size={20} strokeWidth={2.5} />
                </>
              )}
            </button>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={toggleMode}
                className="text-[15px] text-[#007AFF] hover:text-[#006CE0] transition-colors"
              >
                {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
              </button>
            </div>
          </form>

          <p className="mt-10 text-xs text-center text-slate-400 dark:text-slate-500 max-w-[280px] leading-relaxed">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
