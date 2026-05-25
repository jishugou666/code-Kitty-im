import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { AtSign, Lock, ChevronRight, User, Mail, Github, Chrome } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { useAuthStore } from '../../store/authStore';
import { useIsMobile } from '../components/ui/use-mobile';

export function Login() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { login, register, isLoading, error, clearError, setError, isAuthenticated, token } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  const [loginField, setLoginField] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const isMobile = useIsMobile();
  const [isChecking, setIsChecking] = useState(true);
  const [emailError, setEmailError] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [nicknameTouched, setNicknameTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  useEffect(() => {
    if (isAuthenticated && token) {
      navigate('/', { replace: true });
      return;
    }
    setIsChecking(false);
  }, [isAuthenticated, token, navigate]);

  if (isChecking) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/50 dark:from-[#0E1116] dark:via-[#13161A] dark:to-[#0F141A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const validateEmail = (value: string) => {
    if (!value.trim()) return '请输入邮箱';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return '请输入有效的邮箱地址';
    return '';
  };

  const validateNickname = (value: string) => {
    if (!value.trim()) return '请输入昵称';
    if (value.length < 2) return '昵称长度不能少于2位';
    if (value.length > 20) return '昵称长度不能超过20位';
    if (/\s/.test(value)) return '昵称不能包含空格';
    return '';
  };

  const validatePassword = (value: string) => {
    if (!value) return '请输入密码';
    if (value.length < 6) return '密码长度不能少于6位';
    return '';
  };

  const handleEmailBlur = () => {
    setEmailTouched(true);
    setEmailError(validateEmail(email));
  };

  const handleNicknameBlur = () => {
    setNicknameTouched(true);
    setNicknameError(validateNickname(nickname));
  };

  const handlePasswordBlur = () => {
    setPasswordTouched(true);
    setPasswordError(validatePassword(password));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!isLogin) {
      const nickError = validateNickname(nickname);
      const emailErr = validateEmail(email);
      const passError = validatePassword(password);
      
      setNicknameError(nickError);
      setEmailError(emailErr);
      setPasswordError(passError);
      setNicknameTouched(true);
      setEmailTouched(true);
      setPasswordTouched(true);

      if (nickError || emailErr || passError) return;
    } else {
      if (!loginField.trim()) {
        setError('请输入邮箱或昵称');
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
    setEmailError('');
    setNicknameError('');
    setPasswordError('');
    setEmailTouched(false);
    setNicknameTouched(false);
    setPasswordTouched(false);
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
                    onChange={(e) => {
                      setNickname(e.target.value);
                      if (nicknameTouched) setNicknameError(validateNickname(e.target.value));
                    }}
                    onBlur={handleNicknameBlur}
                    className={clsx(
                      isMobile ? "w-full h-12 pl-11 pr-4 bg-white/60 dark:bg-[#0E1116]/60 backdrop-blur-xl rounded-xl outline-none border text-[15px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-[#0E1116] transition-all" : "w-full h-14 pl-14 pr-5 bg-white/60 dark:bg-[#0E1116]/60 backdrop-blur-xl rounded-2xl outline-none border text-[17px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-[#0E1116] transition-all",
                      nicknameError && nicknameTouched
                        ? 'border-red-500/50 focus:border-red-500 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.1)]'
                        : 'border-slate-200/50 dark:border-white/5 focus:border-[#007AFF]/50 focus:shadow-[0_0_0_4px_rgba(0,122,255,0.1)]'
                    )}
                    required
                  />
                  {nicknameError && nicknameTouched && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {nicknameError}
                    </p>
                  )}
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 sm:left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#007AFF] transition-colors">
                    <Mail size={isMobile ? 18 : 22} strokeWidth={2} />
                  </div>
                  <input
                    type="email"
                    placeholder={t('auth.email')}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailTouched) setEmailError(validateEmail(e.target.value));
                    }}
                    onBlur={handleEmailBlur}
                    className={clsx(
                      isMobile ? "w-full h-12 pl-11 pr-4 bg-white/60 dark:bg-[#0E1116]/60 backdrop-blur-xl rounded-xl outline-none border text-[15px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-[#0E1116] transition-all" : "w-full h-14 pl-14 pr-5 bg-white/60 dark:bg-[#0E1116]/60 backdrop-blur-xl rounded-2xl outline-none border text-[17px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-[#0E1116] transition-all",
                      emailError && emailTouched
                        ? 'border-red-500/50 focus:border-red-500 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.1)]'
                        : 'border-slate-200/50 dark:border-white/5 focus:border-[#007AFF]/50 focus:shadow-[0_0_0_4px_rgba(0,122,255,0.1)]'
                    )}
                    required
                  />
                  {emailError && emailTouched && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {emailError}
                    </p>
                  )}
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
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordTouched) setPasswordError(validatePassword(e.target.value));
                }}
                onBlur={handlePasswordBlur}
                className={clsx(
                  isMobile ? "w-full h-12 pl-11 pr-4 bg-white/60 dark:bg-[#0E1116]/60 backdrop-blur-xl rounded-xl outline-none border text-[15px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-[#0E1116] transition-all" : "w-full h-14 pl-14 pr-5 bg-white/60 dark:bg-[#0E1116]/60 backdrop-blur-xl rounded-2xl outline-none border text-[17px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-[#0E1116] transition-all",
                  passwordError && passwordTouched
                    ? 'border-red-500/50 focus:border-red-500 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.1)]'
                    : 'border-slate-200/50 dark:border-white/5 focus:border-[#007AFF]/50 focus:shadow-[0_0_0_4px_rgba(0,122,255,0.1)]'
                )}
                required
                minLength={6}
              />
              {passwordError && passwordTouched && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {passwordError}
                </p>
              )}
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

            {isLogin && (
              <>
                <div className="mt-6 sm:mt-8 flex items-center gap-4">
                  <div className="flex-1 h-px bg-gray-200/60 dark:bg-gray-700/60" />
                  <span className="text-xs text-slate-400 dark:text-slate-500">或</span>
                  <div className="flex-1 h-px bg-gray-200/60 dark:bg-gray-700/60" />
                </div>

                <div className="mt-4 flex justify-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all flex items-center justify-center border border-gray-100 dark:border-gray-700 group"
                  >
                    <Github className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all flex items-center justify-center border border-gray-100 dark:border-gray-700 group"
                  >
                    <Chrome className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </motion.button>
                </div>
              </>
            )}

            <div className="mt-4 sm:mt-6 text-center">
              <button
                type="button"
                onClick={toggleMode}
                className="text-[13px] sm:text-[15px] text-[#007AFF] hover:text-[#006CE0] transition-colors font-medium"
              >
                {isLogin ? "没有账号？注册" : "已有账号？登录"}
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
