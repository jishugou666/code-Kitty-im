import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { AtSign, Lock, ChevronRight, User, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useIsMobile } from '../components/ui/use-mobile';

export function Login() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { login, register, isLoading, error, clearError, setError } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  const [loginField, setLoginField] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const isMobile = useIsMobile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!isLogin) {
      if (!nickname.trim()) {
        setError('请输入昵称');
        return;
      }
      if (nickname.length < 2) {
        setError('昵称长度不能少于2位');
        return;
      }
      if (nickname.length > 20) {
        setError('昵称长度不能超过20位');
        return;
      }
      if (/\s/.test(nickname)) {
        setError('昵称不能包含空格');
        return;
      }
      if (!email.trim()) {
        setError('请输入邮箱');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError('请输入有效的邮箱地址');
        return;
      }
      if (password.length < 6) {
        setError('密码长度不能少于6位');
        return;
      }
    }

    try {
      if (isLogin) {
        await login({ loginField, password });
      } else {
        await register({ password, nickname, email });
      }
      navigate('/');
    } catch (err) {
      console.error(isLogin ? '登录失败:' : '注册失败:', err);
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

      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 z-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={isMobile ? "w-full max-w-sm flex flex-col items-center" : "w-full max-w-md flex flex-col items-center"}
        >
          <div className={`${isMobile ? "w-20 h-20 mb-6" : "w-24 h-24 mb-10"} bg-gradient-to-tr from-[#007AFF] to-[#5AC8FA] rounded-2xl sm:rounded-[28px] shadow-[0_12px_40px_rgba(0,122,255,0.3)] flex items-center justify-center overflow-hidden relative border border-white/40 dark:border-white/10`}>
            <div className="absolute inset-0 bg-white/20 backdrop-blur-sm" />
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={isMobile ? "w-10 h-10 relative z-10" : "w-12 h-12 relative z-10"}
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>

          <h1 className={isMobile ? "text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white mb-2" : "text-4xl font-semibold tracking-tight text-slate-900 dark:text-white mb-3"}>
            {isLogin ? t('auth.welcomeBack') : t('auth.createAccount')}
          </h1>
          <p className={isMobile ? "text-sm text-slate-500 dark:text-slate-400 mb-8" : "text-[16px] text-slate-500 dark:text-slate-400 mb-12"}>
            {isLogin ? t('auth.signInContinue') : t('auth.signUpStart')}
          </p>

          <form
            onSubmit={handleSubmit}
            className={isMobile ? "w-full bg-white/80 dark:bg-[#1C1F26]/80 backdrop-blur-2xl rounded-2xl sm:rounded-[36px] p-5 sm:p-8 shadow-[0_16px_64px_rgba(0,0,0,0.06)] border border-white/60 dark:border-white/5" : "w-full bg-white/60 dark:bg-[#1C1F26]/60 backdrop-blur-2xl rounded-[36px] p-8 shadow-[0_16px_64px_rgba(0,0,0,0.06)] border border-white/60 dark:border-white/5"}
          >
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="mb-4 p-3.5 bg-red-50 dark:bg-red-900/30 border border-red-200/50 dark:border-red-800/50 rounded-xl"
              >
                <p className="text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {error}
                </p>
              </motion.div>
            )}

            <div className="space-y-4 sm:space-y-5">
              {!isLogin && (
                <>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 sm:left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#007AFF] transition-colors">
                      <User size={isMobile ? 18 : 22} strokeWidth={2} />
                    </div>
                    <input
                      type="text"
                      placeholder={t('auth.nickname')}
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className={isMobile ? "w-full h-12 pl-11 pr-4 bg-white/60 dark:bg-[#0E1116]/60 backdrop-blur-xl rounded-xl outline-none border border-slate-200/50 dark:border-white/5 text-[15px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-[#0E1116] focus:border-[#007AFF]/50 focus:shadow-[0_0_0_4px_rgba(0,122,255,0.1)] transition-all" : "w-full h-14 pl-14 pr-5 bg-white/60 dark:bg-[#0E1116]/60 backdrop-blur-xl rounded-2xl outline-none border border-slate-200/50 dark:border-white/5 text-[17px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-[#0E1116] focus:border-[#007AFF]/50 focus:shadow-[0_0_0_4px_rgba(0,122,255,0.1)] transition-all"}
                      required
                    />
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 sm:left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#007AFF] transition-colors">
                      <Mail size={isMobile ? 18 : 22} strokeWidth={2} />
                    </div>
                    <input
                      type="email"
                      placeholder={t('auth.email')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={isMobile ? "w-full h-12 pl-11 pr-4 bg-white/60 dark:bg-[#0E1116]/60 backdrop-blur-xl rounded-xl outline-none border border-slate-200/50 dark:border-white/5 text-[15px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-[#0E1116] focus:border-[#007AFF]/50 focus:shadow-[0_0_0_4px_rgba(0,122,255,0.1)] transition-all" : "w-full h-14 pl-14 pr-5 bg-white/60 dark:bg-[#0E1116]/60 backdrop-blur-xl rounded-2xl outline-none border border-slate-200/50 dark:border-white/5 text-[17px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-[#0E1116] focus:border-[#007AFF]/50 focus:shadow-[0_0_0_4px_rgba(0,122,255,0.1)] transition-all"}
                      required
                    />
                  </div>
                </>
              )}

              {isLogin && (
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 sm:left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#007AFF] transition-colors">
                    <AtSign size={isMobile ? 18 : 22} strokeWidth={2} />
                  </div>
                  <input
                    type="text"
                    placeholder={t('auth.email')}
                    value={loginField}
                    onChange={(e) => setLoginField(e.target.value)}
                    className={isMobile ? "w-full h-12 pl-11 pr-4 bg-white/60 dark:bg-[#0E1116]/60 backdrop-blur-xl rounded-xl outline-none border border-slate-200/50 dark:border-white/5 text-[15px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-[#0E1116] focus:border-[#007AFF]/50 focus:shadow-[0_0_0_4px_rgba(0,122,255,0.1)] transition-all" : "w-full h-14 pl-14 pr-5 bg-white/60 dark:bg-[#0E1116]/60 backdrop-blur-xl rounded-2xl outline-none border border-slate-200/50 dark:border-white/5 text-[17px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-[#0E1116] focus:border-[#007AFF]/50 focus:shadow-[0_0_0_4px_rgba(0,122,255,0.1)] transition-all"}
                    required
                  />
                </div>
              )}

              <div className="relative group">
                <div className="absolute inset-y-0 left-4 sm:left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#007AFF] transition-colors">
                  <Lock size={isMobile ? 18 : 22} strokeWidth={2} />
                </div>
                <input
                  type="password"
                  placeholder={t('auth.password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={isMobile ? "w-full h-12 pl-11 pr-4 bg-white/60 dark:bg-[#0E1116]/60 backdrop-blur-xl rounded-xl outline-none border border-slate-200/50 dark:border-white/5 text-[15px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-[#0E1116] focus:border-[#007AFF]/50 focus:shadow-[0_0_0_4px_rgba(0,122,255,0.1)] transition-all" : "w-full h-14 pl-14 pr-5 bg-white/60 dark:bg-[#0E1116]/60 backdrop-blur-xl rounded-2xl outline-none border border-slate-200/50 dark:border-white/5 text-[17px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-[#0E1116] focus:border-[#007AFF]/50 focus:shadow-[0_0_0_4px_rgba(0,122,255,0.1)] transition-all"}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={isMobile ? "mt-6 w-full h-12 bg-[#007AFF] hover:bg-[#006CE0] active:scale-[0.98] transition-all text-white rounded-xl font-semibold text-[15px] flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(0,122,255,0.25)] disabled:opacity-50 disabled:cursor-not-allowed" : "mt-10 w-full h-14 bg-[#007AFF] hover:bg-[#006CE0] active:scale-[0.98] transition-all text-white rounded-2xl font-semibold text-[17px] flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(0,122,255,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? t('auth.login') : t('auth.register')}
                  <ChevronRight size={isMobile ? 18 : 20} strokeWidth={2.5} />
                </>
              )}
            </button>

            <div className="mt-4 sm:mt-6 text-center">
              <button
                type="button"
                onClick={toggleMode}
                className="text-[13px] sm:text-[15px] text-[#007AFF] hover:text-[#006CE0] transition-colors"
              >
                {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
              </button>
            </div>
          </form>

          <p className={isMobile ? "mt-6 text-xs text-center text-slate-400 dark:text-slate-500 max-w-[260px] leading-relaxed px-4" : "mt-10 text-xs text-center text-slate-400 dark:text-slate-500 max-w-[280px] leading-relaxed"}>
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
