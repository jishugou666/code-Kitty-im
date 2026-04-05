import { ChevronRight, Bell, Lock, Shield, HelpCircle, LogOut, Camera } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from '../../store/authStore';
import { userApi } from '../../api/user';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { useToast } from '../../hooks/useToast';
import { useIsMobile } from '../components/ui/use-mobile';


export function Profile() {
  const navigate = useNavigate();
  const { user, logout, loadUser, updateUser } = useAuthStore();
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  const { toast, ToastContainer } = useToast();
  const isMobile = useIsMobile();
  const [notifications, setNotifications] = useState(true);
  const [privateAccount, setPrivateAccount] = useState(false);
  const [faceId, setFaceId] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    nickname: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    if (!user) {
      loadUser();
    }
  }, [user, loadUser]);

  useEffect(() => {
    if (user) {
      setEditForm({
        nickname: user.nickname || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: 'Logout',
      description: 'Are you sure you want to logout?'
    });
    if (confirmed) {
      await logout();
      navigate('/login');
    }
  };

  const handleSaveProfile = async () => {
    try {
      const response = await userApi.updateProfile(editForm);
      if (response.data) {
        updateUser(response.data);
        setIsEditing(false);
        toast('Profile updated successfully', 'success');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast('Failed to update profile', 'error');
    }
  };

  const handleCancelEdit = () => {
    if (user) {
      setEditForm({
        nickname: user.nickname || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#FAFAFC] dark:bg-[#0A0C10] relative overflow-y-auto scrollbar-hide">
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-blue-100/30 via-[#FAFAFC] to-[#FAFAFC] dark:from-blue-900/10 dark:via-[#0A0C10] dark:to-[#0A0C10] z-0" />

      <div className={isMobile ? "relative z-10 w-full pt-12 pb-24 px-4 flex flex-col items-center" : "relative z-10 max-w-3xl mx-auto w-full pt-16 pb-28 px-8 flex flex-col items-center"}>

        <div className={isMobile ? "flex flex-col items-center mb-8 sm:mb-12" : "flex flex-col items-center mb-12"}>
          <div className="relative group">
            <div className="absolute inset-[-6px] bg-gradient-to-br from-[#007AFF] via-purple-500 to-pink-500 rounded-full blur-[16px] opacity-40 dark:opacity-20" />
            <div className="absolute inset-[-4px] bg-gradient-to-br from-[#007AFF] via-purple-500 to-pink-500 rounded-full opacity-60 dark:opacity-40" />
            <div className={isMobile ? "w-[88px] h-[88px] sm:w-[100px] sm:h-[100px] rounded-full p-[3px] sm:p-[4px] bg-white/20 dark:bg-black/20 backdrop-blur-md relative z-10 overflow-hidden" : "w-[120px] h-[120px] rounded-full p-[4px] bg-white/20 dark:bg-black/20 backdrop-blur-md relative z-10 overflow-hidden"}>
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="Profile"
                  className={isMobile ? "w-full h-full rounded-full object-cover border-[3px] sm:border-[4px] border-white dark:border-[#1A1D21]" : "w-full h-full rounded-full object-cover border-[4px] border-white dark:border-[#1A1D21]"}
                />
              ) : (
                <div className={isMobile ? "w-full h-full rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center text-white text-3xl sm:text-4xl font-bold border-[3px] sm:border-[4px] border-white dark:border-[#1A1D21]" : "w-full h-full rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center text-white text-4xl font-bold border-[4px] border-white dark:border-[#1A1D21]"}>
                  {(user?.nickname || user?.username || 'U')[0].toUpperCase()}
                </div>
              )}
              <button className={isMobile ? "absolute bottom-0 right-0 w-7 h-7 sm:w-8 bg-[#007AFF] rounded-full flex items-center justify-center text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" : "absolute bottom-0 right-0 w-8 h-8 bg-[#007AFF] rounded-full flex items-center justify-center text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"}>
                <Camera size={isMobile ? 12 : 14} />
              </button>
            </div>
          </div>

          {isEditing ? (
            <div className="mt-6 w-full max-w-xs">
              <input
                type="text"
                value={editForm.nickname}
                onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                placeholder="Nickname"
                className="w-full px-4 py-2 text-center text-lg font-semibold bg-white/60 dark:bg-[#13161A]/60 rounded-xl outline-none border border-transparent focus:border-[#007AFF]/50 transition-all mb-3"
              />
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-sm font-medium text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="px-6 py-2 text-sm font-medium bg-[#007AFF] text-white rounded-xl hover:bg-[#006CE0] transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>              <h2
                onClick={() => setIsEditing(true)}
                className={isMobile ? "mt-4 sm:mt-6 text-xl sm:text-2xl font-bold text-black dark:text-white tracking-tight cursor-pointer hover:text-[#007AFF] transition-colors" : "mt-6 text-[28px] font-bold text-black dark:text-white tracking-tight cursor-pointer hover:text-[#007AFF] transition-colors"}
              >
                {user?.nickname || user?.username || 'User'}
              </h2>
              <p className={isMobile ? "text-sm text-black/50 dark:text-white/50 mt-1 font-medium" : "text-[16px] text-black/50 dark:text-white/50 mt-1 font-medium"}>
                @{user?.username}
              </p>
              <p className={isMobile ? "text-xs sm:text-sm text-black/40 dark:text-white/40 mt-1" : "text-[14px] text-black/40 dark:text-white/40 mt-1"}>
                {user?.email || 'No email set'}
              </p>
              {user?.role === 'admin' && (
                <div className="mt-2 px-3 py-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-full shadow-sm">
                  <span className="text-[12px] font-semibold text-white">Admin</span>
                </div>
              )}
            </>
          )}
        </div>

        <div className={isMobile ? "w-full space-y-6" : "w-full space-y-8"}>
          <div className="w-full">
            <span className={isMobile ? "text-[12px] sm:text-[13px] font-semibold text-black/40 dark:text-white/40 uppercase tracking-wider ml-4 sm:ml-6 mb-2 sm:mb-3 block" : "text-[13px] font-semibold text-black/40 dark:text-white/40 uppercase tracking-wider ml-6 mb-3 block"}>
              Account
            </span>
            <div className={isMobile ? "bg-white/60 dark:bg-[#13161A]/60 backdrop-blur-3xl rounded-2xl sm:rounded-[28px] overflow-hidden border border-white/60 dark:border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.02)]" : "bg-white/60 dark:bg-[#13161A]/60 backdrop-blur-3xl rounded-[28px] overflow-hidden border border-white/60 dark:border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.02)]"}>
              <div className={isMobile ? "flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-black/[0.04] dark:border-white/[0.04] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer" : "flex items-center justify-between px-6 py-4 border-b border-black/[0.04] dark:border-white/[0.04] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"}>
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={isMobile ? "w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-[#007AFF]" : "w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-[#007AFF]"}>
                    <Lock size={isMobile ? 18 : 20} strokeWidth={2.5} />
                  </div>
                  <span className={isMobile ? "text-[15px] sm:text-[17px] text-black dark:text-white font-medium" : "text-[17px] text-black dark:text-white font-medium"}>Password</span>
                </div>
                <ChevronRight size={isMobile ? 18 : 20} className="text-black/30 dark:text-white/30" />
              </div>

              <div className={isMobile ? "flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-black/[0.04] dark:border-white/[0.04] hover:bg-black/5 dark:hover:bg-white/5 transition-colors" : "flex items-center justify-between px-6 py-4 border-b border-black/[0.04] dark:border-white/[0.04] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"}>
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={isMobile ? "w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500" : "w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500"}>
                    <Shield size={isMobile ? 18 : 20} strokeWidth={2.5} />
                  </div>
                  <span className={isMobile ? "text-[15px] sm:text-[17px] text-black dark:text-white font-medium" : "text-[17px] text-black dark:text-white font-medium"}>Biometric</span>
                </div>
                <button
                  onClick={() => setFaceId(!faceId)}
                  className={`w-12 h-[28px] sm:w-14 sm:h-[32px] rounded-full p-[3px] transition-colors duration-300 ${
                    faceId ? "bg-[#34C759]" : "bg-black/10 dark:bg-white/10"
                  }`}
                >
                  <div
                    className={`w-[22px] h-[22px] sm:w-[26px] sm:h-[26px] bg-white rounded-full shadow-sm transform transition-transform duration-300 ${
                      faceId ? "translate-x-[20px] sm:translate-x-[24px]" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="w-full">
            <span className={isMobile ? "text-[12px] sm:text-[13px] font-semibold text-black/40 dark:text-white/40 uppercase tracking-wider ml-4 sm:ml-6 mb-2 sm:mb-3 block" : "text-[13px] font-semibold text-black/40 dark:text-white/40 uppercase tracking-wider ml-6 mb-3 block"}>
              Preferences
            </span>
            <div className={isMobile ? "bg-white/60 dark:bg-[#13161A]/60 backdrop-blur-3xl rounded-2xl sm:rounded-[28px] overflow-hidden border border-white/60 dark:border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.02)]" : "bg-white/60 dark:bg-[#13161A]/60 backdrop-blur-3xl rounded-[28px] overflow-hidden border border-white/60 dark:border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.02)]"}>
              <div className={isMobile ? "flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-black/[0.04] dark:border-white/[0.04] hover:bg-black/5 dark:hover:bg-white/5 transition-colors" : "flex items-center justify-between px-6 py-4 border-b border-black/[0.04] dark:border-white/[0.04] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"}>
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={isMobile ? "w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500" : "w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500"}>
                    <Bell size={isMobile ? 18 : 20} strokeWidth={2.5} />
                  </div>
                  <span className={isMobile ? "text-[15px] sm:text-[17px] text-black dark:text-white font-medium" : "text-[17px] text-black dark:text-white font-medium"}>Notifications</span>
                </div>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`w-12 h-[28px] sm:w-14 sm:h-[32px] rounded-full p-[3px] transition-colors duration-300 ${
                    notifications ? "bg-[#34C759]" : "bg-black/10 dark:bg-white/10"
                  }`}
                >
                  <div
                    className={`w-[22px] h-[22px] sm:w-[26px] sm:h-[26px] bg-white rounded-full shadow-sm transform transition-transform duration-300 ${
                      notifications ? "translate-x-[20px] sm:translate-x-[24px]" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className={isMobile ? "flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors" : "flex items-center justify-between px-6 py-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"}>
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={isMobile ? "w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500" : "w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500"}>
                    <Shield size={isMobile ? 18 : 20} strokeWidth={2.5} />
                  </div>
                  <span className={isMobile ? "text-[15px] sm:text-[17px] text-black dark:text-white font-medium" : "text-[17px] text-black dark:text-white font-medium"}>Private</span>
                </div>
                <button
                  onClick={() => setPrivateAccount(!privateAccount)}
                  className={`w-12 h-[28px] sm:w-14 sm:h-[32px] rounded-full p-[3px] transition-colors duration-300 ${
                    privateAccount ? "bg-[#34C759]" : "bg-black/10 dark:bg-white/10"
                  }`}
                >
                  <div
                    className={`w-[22px] h-[22px] sm:w-[26px] sm:h-[26px] bg-white rounded-full shadow-sm transform transition-transform duration-300 ${
                      privateAccount ? "translate-x-[20px] sm:translate-x-[24px]" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className={isMobile ? "w-full pb-20 sm:pb-10" : "w-full pb-10"}>
            <div className={isMobile ? "bg-white/60 dark:bg-[#13161A]/60 backdrop-blur-3xl rounded-2xl sm:rounded-[28px] overflow-hidden border border-white/60 dark:border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.02)]" : "bg-white/60 dark:bg-[#13161A]/60 backdrop-blur-3xl rounded-[28px] overflow-hidden border border-white/60 dark:border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.02)]"}>
              <div className={isMobile ? "flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-black/[0.04] dark:border-white/[0.04] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer" : "flex items-center justify-between px-6 py-4 border-b border-black/[0.04] dark:border-white/[0.04] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"}>
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={isMobile ? "w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500" : "w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500"}>
                    <HelpCircle size={isMobile ? 18 : 20} strokeWidth={2.5} />
                  </div>
                  <span className={isMobile ? "text-[15px] sm:text-[17px] text-black dark:text-white font-medium" : "text-[17px] text-black dark:text-white font-medium"}>Help</span>
                </div>
                <ChevronRight size={isMobile ? 18 : 20} className="text-black/30 dark:text-white/30" />
              </div>

              <div
                onClick={handleLogout}
                className={isMobile ? "flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 hover:bg-red-500/5 dark:hover:bg-red-500/10 transition-colors cursor-pointer" : "flex items-center justify-between px-6 py-4 hover:bg-red-500/5 dark:hover:bg-red-500/10 transition-colors cursor-pointer"}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={isMobile ? "w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500" : "w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500"}>
                    <LogOut size={isMobile ? 18 : 20} strokeWidth={2.5} />
                  </div>
                  <span className={isMobile ? "text-[15px] sm:text-[17px] text-red-500 font-medium" : "text-[17px] text-red-500 font-medium"}>Log Out</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
      <ConfirmDialogComponent />
    </div>
  );
}
