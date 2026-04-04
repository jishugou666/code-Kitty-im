import { ChevronRight, Bell, Lock, Shield, HelpCircle, LogOut } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

export function Profile() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);
  const [privateAccount, setPrivateAccount] = useState(false);
  const [faceId, setFaceId] = useState(true);

  return (
    <div className="flex flex-col h-full bg-[#FAFAFC] dark:bg-[#0A0C10] relative overflow-y-auto scrollbar-hide">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-blue-100/30 via-[#FAFAFC] to-[#FAFAFC] dark:from-blue-900/10 dark:via-[#0A0C10] dark:to-[#0A0C10] z-0" />

      <div className="relative z-10 max-w-3xl mx-auto w-full pt-16 pb-28 px-8 flex flex-col items-center">
        
        {/* Profile Avatar Section */}
        <div className="flex flex-col items-center mb-12">
          <div className="relative">
            <div className="absolute inset-[-6px] bg-gradient-to-br from-[#007AFF] via-purple-500 to-pink-500 rounded-full blur-[16px] opacity-40 dark:opacity-20" />
            <div className="absolute inset-[-4px] bg-gradient-to-br from-[#007AFF] via-purple-500 to-pink-500 rounded-full opacity-60 dark:opacity-40" />
            <div className="w-[120px] h-[120px] rounded-full p-[4px] bg-white/20 dark:bg-black/20 backdrop-blur-md relative z-10">
              <img
                src="https://images.unsplash.com/photo-1624303966826-260632059640?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMGd1eSUyMGNhc3VhbCUyMHBvcnRyYWl0fGVufDF8fHx8MTc3NTI4MDEyMHww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Profile"
                className="w-full h-full rounded-full object-cover border-[4px] border-white dark:border-[#1A1D21]"
              />
            </div>
          </div>
          <h2 className="mt-6 text-[28px] font-bold text-black dark:text-white tracking-tight">
            Jason Miller
          </h2>
          <p className="text-[16px] text-black/50 dark:text-white/50 mt-1 font-medium">
            +1 (555) 123-4567
          </p>
        </div>

        {/* Settings Sections */}
        <div className="w-full space-y-8">
          {/* Section 1: Account */}
          <div className="w-full">
            <span className="text-[13px] font-semibold text-black/40 dark:text-white/40 uppercase tracking-wider ml-6 mb-3 block">
              Account Security
            </span>
            <div className="bg-white/60 dark:bg-[#13161A]/60 backdrop-blur-3xl rounded-[28px] overflow-hidden border border-white/60 dark:border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.04] dark:border-white/[0.04] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-[#007AFF]">
                    <Lock size={20} strokeWidth={2.5} />
                  </div>
                  <span className="text-[17px] text-black dark:text-white font-medium">Password</span>
                </div>
                <ChevronRight size={20} className="text-black/30 dark:text-white/30" />
              </div>

              <div className="flex items-center justify-between px-6 py-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                    <Shield size={20} strokeWidth={2.5} />
                  </div>
                  <span className="text-[17px] text-black dark:text-white font-medium">Biometric Authentication</span>
                </div>
                {/* iOS Switch */}
                <button
                  onClick={() => setFaceId(!faceId)}
                  className={`w-14 h-[32px] rounded-full p-[3px] transition-colors duration-300 ${
                    faceId ? "bg-[#34C759]" : "bg-black/10 dark:bg-white/10"
                  }`}
                >
                  <div
                    className={`w-[26px] h-[26px] bg-white rounded-full shadow-sm transform transition-transform duration-300 ${
                      faceId ? "translate-x-[24px]" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Privacy & Notifications */}
          <div className="w-full">
            <span className="text-[13px] font-semibold text-black/40 dark:text-white/40 uppercase tracking-wider ml-6 mb-3 block">
              Preferences
            </span>
            <div className="bg-white/60 dark:bg-[#13161A]/60 backdrop-blur-3xl rounded-[28px] overflow-hidden border border-white/60 dark:border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.04] dark:border-white/[0.04] hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                    <Bell size={20} strokeWidth={2.5} />
                  </div>
                  <span className="text-[17px] text-black dark:text-white font-medium">Notifications</span>
                </div>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`w-14 h-[32px] rounded-full p-[3px] transition-colors duration-300 ${
                    notifications ? "bg-[#34C759]" : "bg-black/10 dark:bg-white/10"
                  }`}
                >
                  <div
                    className={`w-[26px] h-[26px] bg-white rounded-full shadow-sm transform transition-transform duration-300 ${
                      notifications ? "translate-x-[24px]" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between px-6 py-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                    <Shield size={20} strokeWidth={2.5} />
                  </div>
                  <span className="text-[17px] text-black dark:text-white font-medium">Private Account</span>
                </div>
                <button
                  onClick={() => setPrivateAccount(!privateAccount)}
                  className={`w-14 h-[32px] rounded-full p-[3px] transition-colors duration-300 ${
                    privateAccount ? "bg-[#34C759]" : "bg-black/10 dark:bg-white/10"
                  }`}
                >
                  <div
                    className={`w-[26px] h-[26px] bg-white rounded-full shadow-sm transform transition-transform duration-300 ${
                      privateAccount ? "translate-x-[24px]" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: More */}
          <div className="w-full pb-10">
            <div className="bg-white/60 dark:bg-[#13161A]/60 backdrop-blur-3xl rounded-[28px] overflow-hidden border border-white/60 dark:border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.04] dark:border-white/[0.04] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                    <HelpCircle size={20} strokeWidth={2.5} />
                  </div>
                  <span className="text-[17px] text-black dark:text-white font-medium">Help & Support</span>
                </div>
                <ChevronRight size={20} className="text-black/30 dark:text-white/30" />
              </div>

              <div
                onClick={() => navigate("/login")}
                className="flex items-center justify-between px-6 py-4 hover:bg-red-500/5 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                    <LogOut size={20} strokeWidth={2.5} />
                  </div>
                  <span className="text-[17px] text-red-500 font-medium">Log Out</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
