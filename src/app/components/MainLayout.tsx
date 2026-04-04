import { Outlet, useLocation, useNavigate } from "react-router";
import { MessageCircle, Users, Settings } from "lucide-react";
import { clsx } from "clsx";
import { ChatsSidebar } from "./ChatsSidebar";
import { ContactsSidebar } from "./ContactsSidebar";

export function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: "/", icon: MessageCircle, label: "Chats", isMatch: (p: string) => p === "/" || p.startsWith("/chat") || p.startsWith("/group") },
    { path: "/contacts", icon: Users, label: "Contacts", isMatch: (p: string) => p.startsWith("/contacts") },
    { path: "/profile", icon: Settings, label: "Settings", isMatch: (p: string) => p.startsWith("/profile") },
  ];

  const isContacts = location.pathname.startsWith('/contacts');

  return (
    <div className="flex w-full h-screen bg-[#F4F5F9] dark:bg-[#0A0C10] overflow-hidden">
      {/* Nav Rail - macOS/Telegram Desktop style */}
      <div className="w-[72px] h-full flex flex-col items-center py-6 bg-white/70 dark:bg-[#1A1D21]/70 backdrop-blur-3xl border-r border-black/5 dark:border-white/5 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        {/* Logo */}
        <div className="w-11 h-11 bg-gradient-to-tr from-[#007AFF] to-[#5AC8FA] rounded-[14px] flex items-center justify-center mb-10 shadow-md border border-white/20 dark:border-white/10 relative overflow-hidden">
           <div className="absolute inset-0 bg-white/20 backdrop-blur-sm" />
           <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 relative z-10">
             <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
           </svg>
        </div>
        
        <div className="flex flex-col gap-6 w-full px-2">
          {navItems.map(item => {
            const active = item.isMatch(location.pathname);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center justify-center gap-1.5 group relative"
              >
                <div className={clsx(
                  "p-2.5 rounded-[14px] transition-all duration-300 relative z-10",
                  active
                    ? "text-[#007AFF] bg-blue-50 dark:bg-blue-500/10 shadow-sm"
                    : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300 group-hover:bg-black/5 dark:group-hover:bg-white/5"
                )}>
                  <item.icon strokeWidth={active ? 2.5 : 2} size={22} className={clsx(active && "drop-shadow-sm")} />
                </div>
              </button>
            );
          })}
        </div>
        
        <div className="mt-auto">
           <button onClick={() => navigate("/profile")} className="w-10 h-10 rounded-full border-2 border-transparent hover:border-[#007AFF] transition-all overflow-hidden shadow-sm">
             <img src="https://images.unsplash.com/photo-1624303966826-260632059640?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMGd1eSUyMGNhc3VhbCUyMHBvcnRyYWl0fGVufDF8fHx8MTc3NTI4MDEyMHww&ixlib=rb-4.1.0&q=80&w=1080" alt="Me" className="w-full h-full object-cover" />
           </button>
        </div>
      </div>

      {/* Middle Sidebar Panel */}
      <div className="w-[320px] lg:w-[360px] h-full flex-shrink-0 border-r border-black/5 dark:border-white/5 flex flex-col bg-white/40 dark:bg-[#13161A]/40 backdrop-blur-2xl relative z-40 shadow-[4px_0_24px_rgba(0,0,0,0.01)]">
        {isContacts ? <ContactsSidebar /> : <ChatsSidebar />}
      </div>

      {/* Detail Panel */}
      <div className="flex-1 h-full flex flex-col relative z-30 bg-[#FAFAFC] dark:bg-[#0A0C10] min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
