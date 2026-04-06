import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, User, Lock, Globe, Moon, Bell, Shield, Info, LogOut, Camera } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { settingsApi } from '../../api/settings';
import { uploadApi } from '../../api/upload';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';
import { useIsMobile } from '../components/ui/use-mobile';

export function Settings() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuthStore();
  const { toast, ToastContainer } = useToast();
  const isMobile = useIsMobile();

  const [settings, setSettings] = useState<any>({
    language: 'zh-CN',
    theme: 'light',
    notification_sound: true,
    notification_push: true,
    show_online_status: true,
    allow_stranger_msg: true
  });

  const [profile, setProfile] = useState({
    nickname: user?.nickname || '',
    email: user?.email || '',
    avatar: user?.avatar || ''
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await settingsApi.get();
      if (response.code === 200 && response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSettingChange = async (key: string, value: any) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);

      await settingsApi.update({ [key]: value });

      if (key === 'theme') {
        document.documentElement.classList.toggle('dark', value === 'dark');
      }
      if (key === 'language') {
        i18n.changeLanguage(value);
      }
    } catch (error) {
      console.error('Failed to update setting:', error);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      const response = await settingsApi.updateProfile(profile);
      if (response.code === 200) {
        setUser(response.data);
        toast(t('common.success'), 'success');
      } else {
        toast(response.msg || t('common.error'), 'error');
      }
    } catch (error) {
      toast(t('common.error'), 'error');
    }
  };

  const handlePasswordChange = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast(t('settings.passwordMismatch'), 'error');
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast(t('settings.passwordTooShort'), 'error');
      return;
    }

    try {
      const response = await settingsApi.changePassword({
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword
      });
      if (response.code === 200) {
        toast(t('common.success'), 'success');
        setShowPasswordModal(false);
        setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast(response.msg || t('common.error'), 'error');
      }
    } catch (error) {
      toast(t('common.error'), 'error');
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast(t('settings.imageOnly'), 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (!base64) return;

      setAvatarPreview(base64);

      try {
        const uploadRes = await uploadApi.uploadImage(base64);
        if (uploadRes.code === 200 && uploadRes.data?.url) {
          setProfile(prev => ({ ...prev, avatar: uploadRes.data.url }));
          toast(t('common.success'), 'success');
        } else {
          toast(uploadRes.msg || t('common.error'), 'error');
        }
      } catch (error) {
        console.error('Avatar upload error:', error);
        toast(t('common.error'), 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: User, label: t('settings.profile'), action: () => {} },
    { icon: Lock, label: t('settings.account'), action: () => setShowPasswordModal(true) },
    { icon: Globe, label: t('settings.language'), action: () => {} },
    { icon: Moon, label: t('settings.theme'), action: () => {} },
    { icon: Bell, label: t('settings.privacy'), action: () => {} },
    { icon: Shield, label: t('settings.security'), action: () => {} },
    { icon: Info, label: t('settings.about'), action: () => {} }
  ];

  return (
    <div className={isMobile ? "min-h-screen bg-white dark:bg-[#13161A] pb-20" : "min-h-screen bg-white dark:bg-[#13161A]"}>
      <div className={isMobile ? "sticky top-0 z-50 bg-white/80 dark:bg-[#13161A]/80 backdrop-blur-xl border-b border-black/5 dark:border-white/5" : "sticky top-0 z-50 bg-white/80 dark:bg-[#13161A]/80 backdrop-blur-xl border-b border-black/5 dark:border-white/5"}>
        <div className={isMobile ? "flex items-center gap-3 px-3 py-3" : "flex items-center gap-4 px-4 py-4"}>
          <button onClick={() => navigate(-1)} className={isMobile ? "p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-full" : "p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"}>
            <ArrowLeft size={isMobile ? 18 : 20} className="text-black dark:text-white" />
          </button>
          <h1 className={isMobile ? "text-base font-semibold text-black dark:text-white" : "text-lg font-semibold text-black dark:text-white"}>{t('settings.title')}</h1>
        </div>
      </div>

      <div className={isMobile ? "max-w-2xl mx-auto p-3 space-y-4" : "max-w-2xl mx-auto p-4 space-y-6"}>
        <div className={isMobile ? "bg-white dark:bg-[#1A1D21] rounded-xl p-4 shadow-sm" : "bg-white dark:bg-[#1A1D21] rounded-2xl p-6 shadow-sm"}>
          <h2 className={isMobile ? "text-sm font-semibold text-black dark:text-white mb-3" : "text-base font-semibold text-black dark:text-white mb-4"}>{t('settings.profile')}</h2>

          <div className={isMobile ? "flex items-center gap-3 mb-4" : "flex items-center gap-4 mb-6"}>
            <div className="relative">
              <div
                className={isMobile ? "w-12 h-12 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center text-white text-lg font-semibold cursor-pointer hover:opacity-80 transition-opacity relative overflow-hidden" : "w-16 h-16 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center text-white text-xl font-semibold cursor-pointer hover:opacity-80 transition-opacity relative overflow-hidden"}
                onClick={() => avatarInputRef.current?.click()}
              >
                {(avatarPreview || profile.avatar || user?.avatar) ? (
                  <img
                    src={avatarPreview || profile.avatar || user?.avatar}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile.nickname?.[0]?.toUpperCase() || user?.nickname?.[0]?.toUpperCase() || 'U'
                )}
              </div>
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-[#007AFF] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#006CE0] transition-colors z-10"
              >
                <Camera size={14} />
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div>
              <p className={isMobile ? "text-xs text-black/60 dark:text-white/60" : "text-sm text-black/60 dark:text-white/60"}>@{user?.nickname}</p>
              <p className={isMobile ? "text-[10px] text-[#007AFF] dark:text-[#007AFF] mt-0.5" : "text-xs text-[#007AFF] dark:text-[#007AFF] mt-0.5"}>{t('settings.clickToChangeAvatar')}</p>
            </div>
          </div>

          <div className={isMobile ? "space-y-3" : "space-y-4"}>
            <div>
              <label className={isMobile ? "text-xs text-black/60 dark:text-white/60 mb-1 block" : "text-sm text-black/60 dark:text-white/60 mb-1 block"}>{t('auth.nickname')}</label>
              <input
                type="text"
                value={profile.nickname}
                onChange={(e) => setProfile({ ...profile, nickname: e.target.value })}
                className={isMobile ? "w-full h-10 px-3 bg-black/5 dark:bg-white/5 rounded-xl outline-none text-black dark:text-white text-sm" : "w-full h-11 px-4 bg-black/5 dark:bg-white/5 rounded-xl outline-none text-black dark:text-white"}
              />
            </div>
            <div>
              <label className={isMobile ? "text-xs text-black/60 dark:text-white/60 mb-1 block" : "text-sm text-black/60 dark:text-white/60 mb-1 block"}>{t('auth.email')}</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className={isMobile ? "w-full h-10 px-3 bg-black/5 dark:bg-white/5 rounded-xl outline-none text-black dark:text-white text-sm" : "w-full h-11 px-4 bg-black/5 dark:bg-white/5 rounded-xl outline-none text-black dark:text-white"}
              />
            </div>
            <button
              onClick={handleProfileUpdate}
              className={isMobile ? "w-full h-10 bg-[#007AFF] hover:bg-[#006CE0] text-white font-medium rounded-xl transition-colors text-sm" : "w-full h-11 bg-[#007AFF] hover:bg-[#006CE0] text-white font-medium rounded-xl transition-colors"}
            >
              {t('common.save')}
            </button>
          </div>
        </div>

        <div className={isMobile ? "bg-white dark:bg-[#1A1D21] rounded-xl overflow-hidden shadow-sm" : "bg-white dark:bg-[#1A1D21] rounded-2xl overflow-hidden shadow-sm"}>
          {menuItems.map((item, index) => (
            <button
              key={item.label}
              onClick={item.action}
              className={`w-full flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 sm:py-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
                index !== menuItems.length - 1 ? 'border-b border-black/5 dark:border-white/5' : ''
              }`}
            >
              <item.icon size={isMobile ? 18 : 20} className="text-[#007AFF]" />
              <span className={isMobile ? "flex-1 text-left text-sm text-black dark:text-white" : "flex-1 text-left text-black dark:text-white"}>{item.label}</span>
              <span className="text-black/30 dark:text-white/30">›</span>
            </button>
          ))}
        </div>

        <div className={isMobile ? "bg-white dark:bg-[#1A1D21] rounded-xl p-3 shadow-sm" : "bg-white dark:bg-[#1A1D21] rounded-2xl p-4 shadow-sm"}>
          <div className={isMobile ? "flex items-center gap-3 mb-3" : "flex items-center gap-4 mb-4"}>
            <Globe size={isMobile ? 18 : 20} className="text-[#007AFF]" />
            <span className="text-black dark:text-white text-sm">{t('settings.language')}</span>
          </div>
          <div className={isMobile ? "flex gap-2" : "flex gap-2"}>
            <button
              onClick={() => handleSettingChange('language', 'zh-CN')}
              className={`flex-1 py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                settings.language === 'zh-CN'
                  ? 'bg-[#007AFF] text-white'
                  : 'bg-black/5 dark:bg-white/5 text-black dark:text-white'
              }`}
            >
              中文
            </button>
            <button
              onClick={() => handleSettingChange('language', 'en-US')}
              className={`flex-1 py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                settings.language === 'en-US'
                  ? 'bg-[#007AFF] text-white'
                  : 'bg-black/5 dark:bg-white/5 text-black dark:text-white'
              }`}
            >
              English
            </button>
          </div>
        </div>

        <div className={isMobile ? "bg-white dark:bg-[#1A1D21] rounded-xl p-3 shadow-sm" : "bg-white dark:bg-[#1A1D21] rounded-2xl p-4 shadow-sm"}>
          <div className={isMobile ? "flex items-center gap-3 mb-3" : "flex items-center gap-4 mb-4"}>
            <Moon size={isMobile ? 18 : 20} className="text-[#007AFF]" />
            <span className="text-black dark:text-white text-sm">{t('settings.theme')}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleSettingChange('theme', 'light')}
              className={`flex-1 py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                settings.theme === 'light'
                  ? 'bg-[#007AFF] text-white'
                  : 'bg-black/5 dark:bg-white/5 text-black dark:text-white'
              }`}
            >
              ☀️ {t('settings.light')}
            </button>
            <button
              onClick={() => handleSettingChange('theme', 'dark')}
              className={`flex-1 py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                settings.theme === 'dark'
                  ? 'bg-[#007AFF] text-white'
                  : 'bg-black/5 dark:bg-white/5 text-black dark:text-white'
              }`}
            >
              🌙 {t('settings.dark')}
            </button>
          </div>
        </div>

        {/* 隐私设置 */}
        <div className="bg-white dark:bg-[#1A1D21] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <Shield size={20} className="text-[#007AFF]" />
            <span className="text-black dark:text-white">{t('settings.privacy')}</span>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-black dark:text-white">{t('settings.showOnlineStatus')}</span>
              <button
                onClick={() => handleSettingChange('show_online_status', !settings.show_online_status)}
                className={`w-12 h-7 rounded-full transition-colors ${
                  settings.show_online_status ? 'bg-[#007AFF]' : 'bg-black/20 dark:bg-white/20'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  settings.show_online_status ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-black dark:text-white">{t('settings.allowStrangerMsg')}</span>
              <button
                onClick={() => handleSettingChange('allow_stranger_msg', !settings.allow_stranger_msg)}
                className={`w-12 h-7 rounded-full transition-colors ${
                  settings.allow_stranger_msg ? 'bg-[#007AFF]' : 'bg-black/20 dark:bg-white/20'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  settings.allow_stranger_msg ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* 关于 */}
        <div className="bg-white dark:bg-[#1A1D21] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <Info size={20} className="text-[#007AFF]" />
            <span className="text-black dark:text-white">{t('settings.about')}</span>
          </div>
          <div className="space-y-2 text-sm text-black/60 dark:text-white/60">
            <p>{t('settings.appName')} {t('settings.appVersion')}</p>
            <p>{t('settings.appDescription')}</p>
            <p className="text-xs mt-4">{t('settings.copyright')}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-medium rounded-2xl transition-colors"
        >
          <LogOut size={20} />
          {t('settings.logout')}
        </button>

        <p className="text-center text-xs text-black/30 dark:text-white/30">
          {t('settings.version')}: 1.0.0
        </p>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPasswordModal(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white dark:bg-[#1A1D21] rounded-2xl p-6 w-full max-w-sm shadow-2xl"
          >
            <h3 className="text-lg font-semibold text-black dark:text-white mb-4">{t('settings.changePassword')}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-black/60 dark:text-white/60 mb-1 block">{t('settings.oldPassword')}</label>
                <input
                  type="password"
                  placeholder={t('settings.oldPassword')}
                  value={passwords.oldPassword}
                  onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
                  className="w-full h-11 px-4 bg-black/5 dark:bg-white/5 rounded-xl outline-none text-black dark:text-white"
                />
              </div>
              <div>
                <label className="text-sm text-black/60 dark:text-white/60 mb-1 block">{t('settings.newPassword')}</label>
                <input
                  type="password"
                  placeholder={t('settings.newPassword')}
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  className="w-full h-11 px-4 bg-black/5 dark:bg-white/5 rounded-xl outline-none text-black dark:text-white"
                />
              </div>
              <div>
                <label className="text-sm text-black/60 dark:text-white/60 mb-1 block">{t('settings.confirmNewPassword')}</label>
                <input
                  type="password"
                  placeholder={t('settings.confirmNewPassword')}
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  className="w-full h-11 px-4 bg-black/5 dark:bg-white/5 rounded-xl outline-none text-black dark:text-white"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 h-11 bg-black/5 dark:bg-white/5 text-black dark:text-white font-medium rounded-xl"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handlePasswordChange}
                  className="flex-1 h-11 bg-[#007AFF] text-white font-medium rounded-xl"
                >
                  {t('common.confirm')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}