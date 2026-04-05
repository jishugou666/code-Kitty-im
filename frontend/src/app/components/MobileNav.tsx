import { MessageCircle, Users, Globe, Settings, Shield } from "lucide-react";
import { clsx } from "clsx";
import { motion } from "motion/react";
import { useLocation, useNavigate } from "react-router";
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from "react-i18next";

export function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const navItems = [
    { path: "/", icon: MessageCircle, label: t('chat.message'), isMatch: (p: string) => p === "/" || p.startsWith("/chat") || p.startsWith("/group") },
    { path: "/contacts", icon: Users, label: t('chat.contacts'), isMatch: (p: string) => p.startsWith("/contacts") },
    { path: "/moments", icon: Globe, label: t('moments.title'), isMatch: (p: string) => p.startsWith("/moments") },
    { path: "/profile", icon: Settings, label: t('chat.settings'), isMatch: (p: string) => p.startsWith("/profile") || p.startsWith("/settings") },
  ];

  const adminItem = user?.role === 'admin' ? {
    path: "/admin",
    icon: Shield,
    label: t('admin.title'),
    isMatch: (p: string) => p.startsWith("/admin")
  } : null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex items-center gap-1 px-2 py-1.5 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.15),0_2px_8px_rgba(0,0,0,0.1)] backdrop-blur-3xl bg-white/80 dark:bg-[#1A1D21]/90 border border-white/20 dark:border-white/10"
      >
        {navItems.map((item, index) => {
          const active = item.isMatch(location.pathname);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={clsx(
                "relative flex items-center justify-center transition-all duration-300 rounded-full",
                active ? "w-12 h-12" : "w-11 h-11"
              )}
            >
              {active && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-[#007AFF]/10 dark:bg-[#007AFF]/20 rounded-full"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
              <div className={clsx(
                "relative z-10 transition-all duration-300",
                active
                  ? "text-[#007AFF] scale-110"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              )}>
                <item.icon
                  size={active ? 24 : 22}
                  strokeWidth={active ? 2.5 : 2}
                />
              </div>
              {active && (
                <motion.div
                  className="absolute -bottom-0.5 w-1 h-1 bg-[#007AFF] rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.2 }}
                />
              )}
            </button>
          );
        })}

        {adminItem && (
          <>
            <div className="w-px h-8 bg-black/10 dark:bg-white/10 mx-1" />
            <button
              onClick={() => navigate(adminItem.path)}
              className={clsx(
                "relative flex items-center justify-center transition-all duration-300 rounded-full",
                adminItem.isMatch(location.pathname) ? "w-12 h-12" : "w-11 h-11"
              )}
            >
              {adminItem.isMatch(location.pathname) && (
                <motion.div
                  layoutId="activeAdminTab"
                  className="absolute inset-0 bg-red-500/10 dark:bg-red-500/20 rounded-full"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
              <div className={clsx(
                "relative z-10 transition-all duration-300",
                adminItem.isMatch(location.pathname)
                  ? "text-red-500 scale-110"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              )}>
                <adminItem.icon
                  size={adminItem.isMatch(location.pathname) ? 24 : 22}
                  strokeWidth={adminItem.isMatch(location.pathname) ? 2.5 : 2}
                />
              </div>
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}