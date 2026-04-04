import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Users, MessageSquare, Globe, Database, Eye, Trash2, Shield, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { adminApi } from '../../api/admin';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';

type TabType = 'dashboard' | 'users' | 'conversations' | 'moments' | 'tables';

export function Admin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { toast, ToastContainer } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [dashboard, setDashboard] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [moments, setMoments] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.email !== '3121601311@qq.com') {
      navigate('/');
      return;
    }
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getDashboard();
      if (response.data.code === 200) {
        setDashboard(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getUsers({ page: 1, limit: 50 });
      if (response.data.code === 200) {
        setUsers(response.data.data?.list || []);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getConversations({ page: 1, limit: 50 });
      if (response.data.code === 200) {
        setConversations(response.data.data?.list || []);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoments = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getMoments({ page: 1, limit: 50 });
      if (response.data.code === 200) {
        setMoments(response.data.data?.list || []);
      }
    } catch (error) {
      console.error('Failed to load moments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTables = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getTables();
      if (response.data.code === 200) {
        setTables(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load tables:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (conversationId: number) => {
    setIsLoading(true);
    try {
      const response = await adminApi.getMessages(conversationId);
      if (response.data.code === 200) {
        setMessages(response.data.data?.list || []);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = async (tab: TabType) => {
    setActiveTab(tab);
    setSelectedConversation(null);
    switch (tab) {
      case 'users':
        await loadUsers();
        break;
      case 'conversations':
        await loadConversations();
        break;
      case 'moments':
        await loadMoments();
        break;
      case 'tables':
        await loadTables();
        break;
    }
  };

  const handleBanUser = async (userId: number, currentStatus: number) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      const response = await adminApi.updateUserStatus({ userId, status: newStatus });
      if (response.data.code === 200) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
        toast(t('common.success'), 'success');
      }
    } catch (error) {
      toast(t('common.error'), 'error');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('确定要删除该用户吗？')) return;
    try {
      const response = await adminApi.deleteUser(userId);
      if (response.data.code === 200) {
        setUsers(prev => prev.filter(u => u.id !== userId));
        toast(t('common.success'), 'success');
      }
    } catch (error) {
      toast(t('common.error'), 'error');
    }
  };

  const handleDeleteMoment = async (momentId: number) => {
    try {
      const response = await adminApi.deleteMoment(momentId);
      if (response.data.code === 200) {
        setMoments(prev => prev.filter(m => m.id !== momentId));
        toast(t('common.success'), 'success');
      }
    } catch (error) {
      toast(t('common.error'), 'error');
    }
  };

  const menuItems = [
    { key: 'dashboard' as TabType, icon: Shield, label: t('admin.dashboard') },
    { key: 'users' as TabType, icon: Users, label: t('admin.users') },
    { key: 'conversations' as TabType, icon: MessageSquare, label: t('admin.messages') },
    { key: 'moments' as TabType, icon: Globe, label: t('admin.moments') },
    { key: 'tables' as TabType, icon: Database, label: t('admin.database') }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#13161A] flex">
      <div className="w-64 border-r border-black/5 dark:border-white/5 p-4">
        <div className="flex items-center gap-3 mb-6 px-2">
          <Shield size={24} className="text-[#007AFF]" />
          <h1 className="text-lg font-semibold text-black dark:text-white">{t('admin.title')}</h1>
        </div>
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => handleTabChange(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                activeTab === item.key
                  ? 'bg-[#007AFF]/10 text-[#007AFF]'
                  : 'text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 p-6">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full">
            <ArrowLeft size={20} className="text-black dark:text-white" />
          </button>
          <h2 className="text-xl font-semibold text-black dark:text-white">{menuItems.find(m => m.key === activeTab)?.label}</h2>
        </div>

        {activeTab === 'dashboard' && dashboard && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#007AFF]/10 rounded-2xl p-6">
              <p className="text-sm text-[#007AFF]/70">{t('admin.totalUsers')}</p>
              <p className="text-3xl font-bold text-[#007AFF]">{dashboard.totalUsers}</p>
            </div>
            <div className="bg-[#34C759]/10 rounded-2xl p-6">
              <p className="text-sm text-[#34C759]/70">{t('admin.totalMessages')}</p>
              <p className="text-3xl font-bold text-[#34C759]">{dashboard.totalMessages}</p>
            </div>
            <div className="bg-[#FF9500]/10 rounded-2xl p-6">
              <p className="text-sm text-[#FF9500]/70">{t('admin.totalMoments')}</p>
              <p className="text-3xl font-bold text-[#FF9500]">{dashboard.totalMoments}</p>
            </div>
            <div className="bg-[#AF52DE]/10 rounded-2xl p-6">
              <p className="text-sm text-[#AF52DE]/70">{t('admin.messages')}</p>
              <p className="text-3xl font-bold text-[#AF52DE]">{dashboard.totalConversations}</p>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white dark:bg-[#1A1D21] rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/5 dark:border-white/5">
                  <th className="text-left px-4 py-3 text-sm font-medium text-black/60 dark:text-white/60">ID</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-black/60 dark:text-white/60">User</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-black/60 dark:text-white/60">Email</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-black/60 dark:text-white/60">Role</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-black/60 dark:text-white/60">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-black/60 dark:text-white/60">{t('admin.operations')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5">
                    <td className="px-4 py-3 text-sm text-black/60 dark:text-white/60">{u.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#007AFF] flex items-center justify-center text-white text-xs">
                          {u.nickname?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <span className="text-sm text-black dark:text-white">{u.nickname || u.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-black/60 dark:text-white/60">{u.email}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${u.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${u.status === 1 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                        {u.status === 1 ? 'Active' : 'Banned'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleBanUser(u.id, u.status)}
                          className={`p-1.5 rounded ${u.status === 1 ? 'text-orange-500 hover:bg-orange-50' : 'text-green-500 hover:bg-green-50'}`}
                          title={u.status === 1 ? t('admin.ban') : t('admin.unban')}
                        >
                          <Shield size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 rounded text-red-500 hover:bg-red-50"
                          title={t('common.delete')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'conversations' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white dark:bg-[#1A1D21] rounded-2xl overflow-hidden max-h-[600px] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-white dark:bg-[#1A1D21]">
                  <tr className="border-b border-black/5 dark:border-white/5">
                    <th className="text-left px-4 py-3 text-sm font-medium text-black/60 dark:text-white/60">ID</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-black/60 dark:text-white/60">Type</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-black/60 dark:text-white/60">Messages</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-black/60 dark:text-white/60">{t('admin.operations')}</th>
                  </tr>
                </thead>
                <tbody>
                  {conversations.map((c) => (
                    <tr
                      key={c.id}
                      className={`border-b border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer ${selectedConversation === c.id ? 'bg-[#007AFF]/10' : ''}`}
                      onClick={() => {
                        setSelectedConversation(c.id);
                        loadMessages(c.id);
                      }}
                    >
                      <td className="px-4 py-3 text-sm text-black/60 dark:text-white/60">{c.id}</td>
                      <td className="px-4 py-3 text-sm text-black dark:text-white">{c.type}</td>
                      <td className="px-4 py-3 text-sm text-black/60 dark:text-white/60">{c.message_count}</td>
                      <td className="px-4 py-3">
                        <Eye size={16} className="text-[#007AFF]" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white dark:bg-[#1A1D21] rounded-2xl overflow-hidden max-h-[600px] overflow-y-auto">
              <div className="p-4 border-b border-black/5 dark:border-white/5">
                <h3 className="font-medium text-black dark:text-white">{t('admin.messageList')} {selectedConversation && `#${selectedConversation}`}</h3>
              </div>
              <div className="divide-y divide-black/5 dark:divide-white/5">
                {messages.map((m) => (
                  <div key={m.id} className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-[#007AFF]">{m.sender_nickname || 'Unknown'}</span>
                      <span className="text-xs text-black/40 dark:text-white/40">{new Date(m.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-black dark:text-white">{m.content}</p>
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="p-8 text-center text-black/40 dark:text-white/40 text-sm">
                    {t('chat.noMessages')}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'moments' && (
          <div className="bg-white dark:bg-[#1A1D21] rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/5 dark:border-white/5">
                  <th className="text-left px-4 py-3 text-sm font-medium text-black/60 dark:text-white/60">ID</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-black/60 dark:text-white/60">User</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-black/60 dark:text-white/60">Content</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-black/60 dark:text-white/60">Likes</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-black/60 dark:text-white/60">{t('admin.operations')}</th>
                </tr>
              </thead>
              <tbody>
                {moments.map((m) => (
                  <tr key={m.id} className="border-b border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5">
                    <td className="px-4 py-3 text-sm text-black/60 dark:text-white/60">{m.id}</td>
                    <td className="px-4 py-3 text-sm text-black dark:text-white">{m.nickname || m.username}</td>
                    <td className="px-4 py-3 text-sm text-black/60 dark:text-white/60 max-w-xs truncate">{m.content}</td>
                    <td className="px-4 py-3 text-sm text-black/60 dark:text-white/60">{m.likes_count}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteMoment(m.id)}
                        className="p-1.5 rounded text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'tables' && (
          <div className="bg-white dark:bg-[#1A1D21] rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/5 dark:border-white/5">
                  <th className="text-left px-4 py-3 text-sm font-medium text-black/60 dark:text-white/60">{t('admin.tableName')}</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-black/60 dark:text-white/60">{t('admin.recordCount')}</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-black/60 dark:text-white/60">Data Size</th>
                </tr>
              </thead>
              <tbody>
                {tables.map((table) => (
                  <tr key={table.TABLE_NAME} className="border-b border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5">
                    <td className="px-4 py-3 text-sm font-mono text-[#007AFF]">{table.TABLE_NAME}</td>
                    <td className="px-4 py-3 text-sm text-black/60 dark:text-white/60">{table.TABLE_ROWS || 0}</td>
                    <td className="px-4 py-3 text-sm text-black/60 dark:text-white/60">
                      {table.DATA_LENGTH ? `${(table.DATA_LENGTH / 1024).toFixed(2)} KB` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ToastContainer />
    </div>
  );
}