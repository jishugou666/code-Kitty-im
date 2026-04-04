import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { AtSign, Lock, ChevronRight } from "lucide-react";

export function Login() {
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/");
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/50 dark:from-[#0E1116] dark:via-[#13161A] dark:to-[#0F141A] flex flex-col relative overflow-hidden">
      {/* Abstract Background Blur Orbs for Desktop scale */}
      <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Glass Navigation / Empty Space */}
      <div className="h-20 w-full bg-white/30 dark:bg-[#1A1D21]/30 backdrop-blur-3xl border-b border-white/50 dark:border-white/5 z-10" />

      <div className="flex-1 flex flex-col items-center justify-center px-8 z-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md flex flex-col items-center"
        >
          {/* Logo */}
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
            Welcome back
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-[16px] mb-12">
            Sign in to continue to Chat
          </p>

          <form
            onSubmit={handleLogin}
            className="w-full bg-white/60 dark:bg-[#1C1F26]/60 backdrop-blur-2xl rounded-[36px] p-8 shadow-[0_16px_64px_rgba(0,0,0,0.06)] border border-white/60 dark:border-white/5"
          >
            <div className="space-y-5">
              {/* Account Input */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#007AFF] transition-colors">
                  <AtSign size={22} strokeWidth={2} />
                </div>
                <input
                  type="text"
                  placeholder="Account"
                  className="w-full h-14 pl-14 pr-5 bg-white/60 dark:bg-[#0E1116]/60 backdrop-blur-xl rounded-2xl outline-none border border-slate-200/50 dark:border-white/5 text-[17px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-[#0E1116] focus:border-[#007AFF]/50 focus:shadow-[0_0_0_4px_rgba(0,122,255,0.1)] transition-all"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#007AFF] transition-colors">
                  <Lock size={22} strokeWidth={2} />
                </div>
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full h-14 pl-14 pr-5 bg-white/60 dark:bg-[#0E1116]/60 backdrop-blur-xl rounded-2xl outline-none border border-slate-200/50 dark:border-white/5 text-[17px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-[#0E1116] focus:border-[#007AFF]/50 focus:shadow-[0_0_0_4px_rgba(0,122,255,0.1)] transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-10 w-full h-14 bg-[#007AFF] hover:bg-[#006CE0] active:scale-[0.98] transition-all text-white rounded-2xl font-semibold text-[17px] flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(0,122,255,0.25)]"
            >
              Sign In
              <ChevronRight size={20} strokeWidth={2.5} />
            </button>
          </form>

          <p className="mt-10 text-xs text-center text-slate-400 dark:text-slate-500 max-w-[280px] leading-relaxed">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
