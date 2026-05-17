import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router';
import {
  Shield, Settings, ArrowLeft, Save, Eye, Palette, Type,
  Link, Clock, Image, LayoutDashboard, LogOut, Menu, X,
  ChevronDown, ChevronRight, Plus, Trash2, Edit2
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('studio_admin_token') || ''}`,
  };
}

type TabType = 'hero' | 'about' | 'cta' | 'custom' | 'settings';

interface SettingItem {
  id: number;
  section: string;
  keyName: string;
  value: string;
  type: string;
  description: string;
  sort_order: number;
}

export function StudioAdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('hero');
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [rawSettings, setRawSettings] = useState<SettingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [customKey, setCustomKey] = useState('');
  const [customValue, setCustomValue] = useState('');
  const [customSection, setCustomSection] = useState('hero');
  const [customType, setCustomType] = useState('string');

  useEffect(() => {
    const token = localStorage.getItem('studio_admin_token');
    if (!token) {
      navigate('/studio/admin/login');
      return;
    }
    loadSettings();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/studio/admin/settings`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.code === 200) {
        setSettings(data.data);
      } else if (data.code === 401) {
        localStorage.removeItem('studio_admin_token');
        localStorage.removeItem('studio_admin_user');
        navigate('/studio/admin/login');
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRawSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/studio/admin/settings`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.code === 200) {
        return data.data;
      }
    } catch (err) {
      console.error('Failed to load raw settings:', err);
    }
    return {};
  };

  const updateSetting = async (section: string, key: string, value: any, type = 'string') => {
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/studio/admin/settings/${section}/${key}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ value, type }),
      });
      const data = await res.json();
      if (data.code === 200) {
        setSettings(prev => ({
          ...prev,
          [section]: { ...(prev[section] || {}), [key]: type === 'json' ? value : value },
        }));
        setToast({ message: '保存成功', type: 'success' });
      } else {
        setToast({ message: data.message || '保存失败', type: 'error' });
      }
    } catch (err) {
      setToast({ message: '网络错误', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const batchUpdate = async (updates: Array<{ section: string; key: string; value: any; type: string }>) => {
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/studio/admin/settings/batch`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ settings: updates }),
      });
      const data = await res.json();
      if (data.code === 200) {
        await loadSettings();
        setToast({ message: `成功更新 ${data.data?.count || updates.length} 项配置`, type: 'success' });
      } else {
        setToast({ message: data.message || '批量保存失败', type: 'error' });
      }
    } catch (err) {
      setToast({ message: '网络错误', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('studio_admin_token');
    localStorage.removeItem('studio_admin_user');
    navigate('/studio/admin/login');
  };

  const menuItems: { key: TabType; icon: React.ComponentType<any>; label: string }[] = [
    { key: 'hero', icon: LayoutDashboard, label: 'Hero 区域' },
    { key: 'about', icon: Type, label: '关于区域' },
    { key: 'cta', icon: Palette, label: 'CTA 区域' },
    { key: 'custom', icon: Plus, label: '自定义配置' },
    { key: 'settings', icon: Settings, label: '所有配置' },
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-[#0A0C10] dark:to-[#13161A] flex flex-col ${isMobile ? 'pb-20' : ''}`}>
      <Toast message={toast?.message} type={toast?.type} />

      {isMobile && (
        <div className="flex items-center justify-between px-4 py-3 bg-white/50 dark:bg-[#13161A]/50 backdrop-blur-xl border-b border-black/10 dark:border-white/10 sticky top-0 z-50">
          <button onClick={() => navigate('/studio')} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors">
            <ArrowLeft size={20} className="text-black dark:text-white" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <h1 className="text-sm font-bold text-black dark:text-white">Studio Admin</h1>
          </div>
          <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors">
            {showMobileMenu ? <X size={20} className="text-black dark:text-white" /> : <Menu size={20} className="text-black dark:text-white" />}
          </button>
        </div>
      )}

      <AnimatePresence>
        {isMobile && showMobileMenu && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-0 right-0 z-50 p-4 bg-white/95 dark:bg-[#13161A]/95 backdrop-blur-xl border-b border-black/10 dark:border-white/10"
          >
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => { setActiveTab(item.key); setShowMobileMenu(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                    activeTab === item.key
                      ? 'bg-gradient-to-r from-[#007AFF] to-[#5856D6] text-white shadow-lg shadow-[#007AFF]/20'
                      : 'text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </button>
              ))}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut size={18} />
                <span>退出登录</span>
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 overflow-hidden">
        {!isMobile && (
          <div className="w-64 border-r border-black/10 dark:border-white/10 p-4 bg-white/50 dark:bg-[#13161A]/50 backdrop-blur-xl flex flex-col">
            <div className="flex items-center gap-3 mb-8 px-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center">
                <Shield size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-black dark:text-white">Studio Admin</h1>
                <p className="text-xs text-black/40 dark:text-white/40">工作室后台管理</p>
              </div>
            </div>
            <nav className="space-y-1 flex-1">
              {menuItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                    activeTab === item.key
                      ? 'bg-gradient-to-r from-[#007AFF] to-[#5856D6] text-white shadow-lg shadow-[#007AFF]/20'
                      : 'text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
            <button
              onClick={handleLogout}
              className="mt-4 w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut size={18} />
              <span>退出登录</span>
            </button>
          </div>
        )}

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-black dark:text-white">
              {menuItems.find(m => m.key === activeTab)?.label}
            </h2>
            {isSaving && (
              <div className="flex items-center gap-2 text-sm text-[#007AFF]">
                <div className="w-4 h-4 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
                保存中...
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {activeTab === 'hero' && <HeroConfig settings={settings.hero || {}} onUpdate={updateSetting} />}
              {activeTab === 'about' && <AboutConfig settings={settings.about || {}} onUpdate={updateSetting} />}
              {activeTab === 'cta' && <CtaConfig settings={settings.cta || {}} onUpdate={updateSetting} />}
              {activeTab === 'custom' && (
                <CustomConfig
                  section={customSection}
                  onSectionChange={setCustomSection}
                  keyName={customKey}
                  onKeyChange={setCustomKey}
                  value={customValue}
                  onValueChange={setCustomValue}
                  type={customType}
                  onTypeChange={setCustomType}
                  onAdd={() => {
                    if (!customKey || !customValue) return;
                    updateSetting(customSection, customKey, customType === 'json' ? JSON.parse(customValue) : customValue, customType);
                    setCustomKey('');
                    setCustomValue('');
                  }}
                />
              )}
              {activeTab === 'settings' && (
                <AllSettingsView
                  settings={settings}
                  onUpdate={updateSetting}
                  onRefresh={loadSettings}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Toast({ message, type }: { message?: string; type?: 'success' | 'error' }) {
  if (!message) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 ${
        type === 'success'
          ? 'bg-green-500 text-white'
          : 'bg-red-500 text-white'
      }`}
    >
      {type === 'success' ? '✓' : '✗'} {message}
    </motion.div>
  );
}

function HeroConfig({ settings, onUpdate }: { settings: any; onUpdate: (s: string, k: string, v: any, t?: string) => void }) {
  const fields = [
    { key: 'subtitle', label: '副标题', type: 'text', icon: Type },
    { key: 'dateText', label: '日期文本', type: 'text', icon: Clock },
    { key: 'countdownTarget', label: '倒计时目标日期', type: 'text', icon: Clock },
    { key: 'countdownLabel', label: '倒计时标签', type: 'text', icon: Clock },
    { key: 'primaryButtonText', label: '主按钮文字', type: 'text', icon: Type },
    { key: 'primaryButtonLink', label: '主按钮链接', type: 'text', icon: Link },
    { key: 'secondaryButtonText', label: '副按钮文字', type: 'text', icon: Type },
    { key: 'secondaryButtonLink', label: '副按钮链接', type: 'text', icon: Link },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#1A1D21] rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Hero 区域配置</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.map(({ key, label, type, icon: Icon }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-black/60 dark:text-white/60 mb-2">
                <div className="flex items-center gap-2">
                  <Icon size={14} />
                  {label}
                </div>
              </label>
              <input
                type={type}
                value={settings[key] || ''}
                onChange={(e) => onUpdate('hero', key, e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent text-black dark:text-white focus:border-[#007AFF] focus:outline-none transition-colors"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AboutConfig({ settings, onUpdate }: { settings: any; onUpdate: (s: string, k: string, v: any, t?: string) => void }) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#1A1D21] rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">关于区域配置</h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-black/60 dark:text-white/60 mb-2">标题</label>
            <input
              type="text"
              value={settings.title || ''}
              onChange={(e) => onUpdate('about', 'title', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent text-black dark:text-white focus:border-[#007AFF] focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black/60 dark:text-white/60 mb-2">简介</label>
            <textarea
              value={settings.description || ''}
              onChange={(e) => onUpdate('about', 'description', e.target.value)}
              rows={6}
              className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent text-black dark:text-white focus:border-[#007AFF] focus:outline-none transition-colors resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function CtaConfig({ settings, onUpdate }: { settings: any; onUpdate: (s: string, k: string, v: any, t?: string) => void }) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#1A1D21] rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">CTA 区域配置</h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-black/60 dark:text-white/60 mb-2">标题</label>
            <input
              type="text"
              value={settings.title || ''}
              onChange={(e) => onUpdate('cta', 'title', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent text-black dark:text-white focus:border-[#007AFF] focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black/60 dark:text-white/60 mb-2">描述</label>
            <textarea
              value={settings.description || ''}
              onChange={(e) => onUpdate('cta', 'description', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent text-black dark:text-white focus:border-[#007AFF] focus:outline-none transition-colors resize-none"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-black/60 dark:text-white/60 mb-2">主按钮文字</label>
              <input
                type="text"
                value={settings.primaryButtonText || ''}
                onChange={(e) => onUpdate('cta', 'primaryButtonText', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent text-black dark:text-white focus:border-[#007AFF] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black/60 dark:text-white/60 mb-2">主按钮链接</label>
              <input
                type="text"
                value={settings.primaryButtonLink || ''}
                onChange={(e) => onUpdate('cta', 'primaryButtonLink', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent text-black dark:text-white focus:border-[#007AFF] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black/60 dark:text-white/60 mb-2">副按钮文字</label>
              <input
                type="text"
                value={settings.secondaryButtonText || ''}
                onChange={(e) => onUpdate('cta', 'secondaryButtonText', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent text-black dark:text-white focus:border-[#007AFF] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-black/60 dark:text-white/60 mb-2">副按钮链接</label>
              <input
                type="text"
                value={settings.secondaryButtonLink || ''}
                onChange={(e) => onUpdate('cta', 'secondaryButtonLink', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent text-black dark:text-white focus:border-[#007AFF] focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomConfig({ section, onSectionChange, keyName, onKeyChange, value, onValueChange, type, onTypeChange, onAdd }: {
  section: string; onSectionChange: (v: string) => void;
  keyName: string; onKeyChange: (v: string) => void;
  value: string; onValueChange: (v: string) => void;
  type: string; onTypeChange: (v: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#1A1D21] rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">添加自定义配置</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-black/60 dark:text-white/60 mb-2">区域</label>
            <input
              type="text"
              value={section}
              onChange={(e) => onSectionChange(e.target.value)}
              placeholder="hero, about, cta, ..."
              className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent text-black dark:text-white focus:border-[#007AFF] focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black/60 dark:text-white/60 mb-2">键名</label>
            <input
              type="text"
              value={keyName}
              onChange={(e) => onKeyChange(e.target.value)}
              placeholder="subtitle, title, ..."
              className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent text-black dark:text-white focus:border-[#007AFF] focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black/60 dark:text-white/60 mb-2">类型</label>
            <select
              value={type}
              onChange={(e) => onTypeChange(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent text-black dark:text-white focus:border-[#007AFF] focus:outline-none transition-colors"
            >
              <option value="string">string</option>
              <option value="number">number</option>
              <option value="boolean">boolean</option>
              <option value="json">json</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-black/60 dark:text-white/60 mb-2">值</label>
            <input
              type="text"
              value={value}
              onChange={(e) => onValueChange(e.target.value)}
              placeholder="配置值"
              className="w-full px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 bg-transparent text-black dark:text-white focus:border-[#007AFF] focus:outline-none transition-colors"
            />
          </div>
        </div>
        <button
          onClick={onAdd}
          disabled={!keyName || !value}
          className="mt-6 px-6 py-3 bg-gradient-to-r from-[#007AFF] to-[#5856D6] text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
        >
          <Plus size={16} />
          添加配置
        </button>
      </div>
    </div>
  );
}

function AllSettingsView({ settings, onUpdate, onRefresh }: { settings: any; onUpdate: (s: string, k: string, v: any, t?: string) => void; onRefresh: () => void }) {
  const sections = Object.keys(settings);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-black dark:text-white">所有配置</h3>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-[#007AFF]/10 text-[#007AFF] rounded-xl hover:bg-[#007AFF]/20 transition-colors text-sm"
        >
          刷新
        </button>
      </div>
      {sections.map(section => (
        <div key={section} className="bg-white dark:bg-[#1A1D21] rounded-2xl p-6 shadow-lg">
          <h4 className="text-base font-semibold text-black dark:text-white mb-4 capitalize">{section} 区域</h4>
          <div className="space-y-4">
            {Object.entries(settings[section]).map(([key, value]) => (
              <div key={key} className="flex items-center gap-4 p-3 bg-black/5 dark:bg-white/5 rounded-xl">
                <span className="text-sm font-mono text-[#007AFF] min-w-[120px]">{key}</span>
                <input
                  type="text"
                  value={typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  onChange={(e) => onUpdate(section, key, e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-black dark:text-white text-sm focus:border-[#007AFF] focus:outline-none transition-colors"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
      {sections.length === 0 && (
        <div className="text-center text-black/40 dark:text-white/40 py-12">
          暂无配置数据
        </div>
      )}
    </div>
  );
}
