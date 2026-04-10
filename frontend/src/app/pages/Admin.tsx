import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Users, MessageSquare, Globe, Database, Eye, Trash2, Shield, AlertTriangle, Settings, Ban, Unlock, Crown, X, MessageCircle, ChevronDown, Edit2, Save, UserPlus, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router';
import { adminApi } from '../../api/admin';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { useIsMobile } from '../components/ui/use-mobile';

type TabType = 'dashboard' | 'users' | 'conversations' | 'moments' | 'tables' | 'groups';

const COLORS = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', '#5856D6'];

export function Admin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { toast, ToastContainer } = useToast();
  const isMobile = useIsMobile();

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [dashboard, setDashboard] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [messageStats, setMessageStats] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [moments, setMoments] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [selectedMoment, setSelectedMoment] = useState<any>(null);
  const [momentComments, setMomentComments] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionMenu, setActionMenu] = useState<number | null>(null);
  const [banModal, setBanModal] = useState<{ userId: number; username: string; isBanned: boolean } | null>(null);
  const [banDuration, setBanDuration] = useState('7');
  const [banReason, setBanReason] = useState('');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getDashboard();
      if (res.code === 200) {
        setDashboard(res.data);
      }
      const statsRes = await adminApi.getUsers({ page: 1, limit: 100 });
      if (statsRes.code === 200) {
        const allUsers = statsRes.data?.list || [];
        const onlineUsers = allUsers.filter((u: any) => u.status === 1).length;
        const adminUsers = allUsers.filter((u: any) => u.role === 'admin' || u.role === 'tech_god').length;
        setUserStats({
          total: allUsers.length,
          online: onlineUsers,
          admins: adminUsers,
          normal: allUsers.length - adminUsers
        });
      }
      const convRes = await adminApi.getConversations({ page: 1, limit: 100 });
      if (convRes.code === 200) {
        const convs = convRes.data?.list || [];
        setConversations(convs);
        setMessageStats([
          { name: '私聊', value: convs.filter((c: any) => c.type === 'single').length },
          { name: '群聊', value: convs.filter((c: any) => c.type === 'group').length }
        ]);
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
      const res = await adminApi.getUsers({ page: 1, limit: 100 });
      if (res.code === 200) {
        console.log('Users loaded:', res.data?.list?.map((u: any) => ({
          id: u.id,
          username: u.username,
          status: u.status,
          ban_status: u.ban_status
        })));
        setUsers(res.data?.list || []);
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
      const res = await adminApi.getConversations({ page: 1, limit: 100 });
      if (res.code === 200) {
        setConversations(res.data?.list || []);
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
      const res = await adminApi.getMoments({ page: 1, limit: 100 });
      if (res.code === 200) {
        setMoments(res.data?.list || []);
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
      const res = await adminApi.getTables();
      if (res.code === 200) {
        setTables(res.data || []);
      }
    } catch (error) {
      console.error('Failed to load tables:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGroups = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getGroups({ page: 1, limit: 100 });
      if (res.code === 200) {
        setGroups(res.data?.list || []);
      }
    } catch (error) {
      console.error('Failed to load groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGroupMembers = async (groupId: number) => {
    try {
      const res = await adminApi.getGroupMembers(groupId);
      if (res.code === 200) {
        setGroupMembers(res.data || []);
      }
    } catch (error) {
      console.error('Failed to load group members:', error);
    }
  };

  const loadTableData = async (tableName: string) => {
    setIsLoading(true);
    setSelectedTable(tableName);
    try {
      const res = await adminApi.getTableData(tableName, { page: 1, limit: 50 });
      if (res.code === 200) {
        setTableData(res.data?.list || []);
      }
    } catch (error) {
      console.error('Failed to load table data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (conversationId: number) => {
    setIsLoading(true);
    try {
      const res = await adminApi.getMessages(conversationId);
      if (res.code === 200) {
        setMessages(res.data?.list || []);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMomentComments = async (momentId: number) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/moments/${momentId}/comments`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.code === 200) {
        setMomentComments(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleTabChange = async (tab: TabType) => {
    setActiveTab(tab);
    setSelectedConversation(null);
    setSelectedTable(null);
    setTableData([]);
    setSelectedMoment(null);
    setSelectedGroup(null);
    setGroupMembers([]);
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
      case 'groups':
        await loadGroups();
        break;
    }
  };

  const handleSetRole = async (userId: number, role: string) => {
    try {
      const res = await adminApi.updateUserRole({ userId, role });
      if (res.code === 200) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
        toast(role === 'admin' ? '已设为管理员' : '已设为普通用户', 'success');
      }
      setActionMenu(null);
    } catch (error) {
      toast(t('common.error'), 'error');
    }
  };

  const handleBanUser = async () => {
    if (!banModal) return;
    try {
      const newStatus = banModal.isBanned ? 1 : 0;
      const durationDays = banModal.isBanned ? null : (banDuration === '365' ? null : parseInt(banDuration));
      const res = await adminApi.updateUserStatus({
        userId: banModal.userId,
        status: newStatus,
        reason: banModal.isBanned ? null : banReason,
        durationDays
      });
      if (res.code === 200) {
        setUsers(prev => prev.map(u => u.id === banModal.userId ? {
          ...u,
          status: newStatus,
          ban_status: newStatus === 0 ? 'banned' : 'active'
        } : u));
        toast(banModal.isBanned ? '已解封' : `已封禁 ${banDuration === '365' ? '永久' : banDuration + ' 天'}`, 'success');
        setBanModal(null);
        setBanReason('');
      }
    } catch (error) {
      toast(t('common.error'), 'error');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('确定要删除该用户吗？此操作不可恢复！')) return;
    try {
      const res = await adminApi.deleteUser(userId);
      if (res.code === 200) {
        setUsers(prev => prev.filter(u => u.id !== userId));
        toast(t('common.success'), 'success');
      }
    } catch (error) {
      toast(t('common.error'), 'error');
    }
  };

  const handleDeleteMoment = async (momentId: number) => {
    if (!confirm('确定要删除该动态吗？')) return;
    try {
      const res = await adminApi.deleteMoment(momentId);
      if (res.code === 200) {
        setMoments(prev => prev.filter(m => m.id !== momentId));
        toast(t('common.success'), 'success');
      }
    } catch (error) {
      toast(t('common.error'), 'error');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('确定要删除该评论吗？')) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/moments/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.code === 200) {
        setMomentComments(prev => prev.filter(c => c.id !== commentId));
        toast(t('common.success'), 'success');
      }
    } catch (error) {
      toast(t('common.error'), 'error');
    }
  };

  const handleDeleteGroup = async (groupId: number) => {
    if (!confirm('确定要删除该群组吗？此操作不可恢复！')) return;
    try {
      const res = await adminApi.deleteGroup(groupId);
      if (res.code === 200) {
        setGroups(prev => prev.filter(g => g.id !== groupId));
        setSelectedGroup(null);
        toast('群组已删除', 'success');
      }
    } catch (error) {
      toast(t('common.error'), 'error');
    }
  };

  const menuItems = [
    { key: 'dashboard' as TabType, icon: Shield, label: '仪表盘' },
    { key: 'users' as TabType, icon: Users, label: '用户管理' },
    { key: 'conversations' as TabType, icon: MessageSquare, label: '消息管理' },
    { key: 'moments' as TabType, icon: Globe, label: '朋友圈' },
    { key: 'tables' as TabType, icon: Database, label: '数据库' },
    { key: 'groups' as TabType, icon: UserPlus, label: '群组管理' }
  ];

  return (
    <div className={isMobile ? "h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#0A0C10] dark:to-[#13161A] pb-20" : "h-full flex bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#0A0C10] dark:to-[#13161A]"}>
      {isMobile && (
        <div className="flex items-center justify-between px-4 py-3 bg-white/50 dark:bg-[#13161A]/50 backdrop-blur-xl border-b border-black/10 dark:border-white/10">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors">
            <ArrowLeft size={20} className="text-black dark:text-white" />
          </button>
          <h1 className="text-base font-bold text-black dark:text-white">管理中心</h1>
          <button onClick={() => setShowMobileSidebar(!showMobileSidebar)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors">
            <Menu size={20} className="text-black dark:text-white" />
          </button>
        </div>
      )}

      {isMobile && showMobileSidebar && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-16 left-0 right-0 z-50 p-4 bg-white/95 dark:bg-[#13161A]/95 backdrop-blur-xl border-b border-black/10 dark:border-white/10"
        >
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => { handleTabChange(item.key); setShowMobileSidebar(false); }}
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
        </motion.div>
      )}

      {!isMobile && (
        <div className="w-64 border-r border-black/10 dark:border-white/10 p-4 bg-white/50 dark:bg-[#13161A]/50 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-black dark:text-white">管理中心</h1>
              <p className="text-xs text-black/40 dark:text-white/40">{t('admin.title')}</p>
            </div>
          </div>
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleTabChange(item.key)}
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
        </div>
      )}

      <div className={isMobile ? "flex-1 p-3 overflow-y-auto" : "flex-1 p-6 overflow-y-auto"}>
        {!isMobile && (
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors">
              <ArrowLeft size={20} className="text-black dark:text-white" />
            </button>
            <h2 className="text-2xl font-bold text-black dark:text-white">{menuItems.find(m => m.key === activeTab)?.label}</h2>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-4 sm:space-y-6">
            <div className={isMobile ? "grid grid-cols-2 gap-2 sm:gap-4" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={isMobile ? "bg-white dark:bg-[#1A1D21] rounded-xl p-3 sm:p-4 shadow-lg shadow-[#007AFF]/10" : "bg-white dark:bg-[#1A1D21] rounded-2xl p-6 shadow-lg shadow-[#007AFF]/10"}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={isMobile ? "text-[10px] sm:text-sm text-black/40 dark:text-white/40" : "text-sm text-black/40 dark:text-white/40"}>总用户数</p>
                    <p className={isMobile ? "text-xl sm:text-2xl font-bold text-[#007AFF]" : "text-3xl font-bold text-[#007AFF]"}>{dashboard?.totalUsers || 0}</p>
                  </div>
                  <div className={isMobile ? "w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-[#007AFF]/10 flex items-center justify-center" : "w-12 h-12 rounded-xl bg-[#007AFF]/10 flex items-center justify-center"}>
                    <Users size={isMobile ? 18 : 24} className="text-[#007AFF]" />
                  </div>
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={isMobile ? "bg-white dark:bg-[#1A1D21] rounded-xl p-3 sm:p-4 shadow-lg shadow-[#34C759]/10" : "bg-white dark:bg-[#1A1D21] rounded-2xl p-6 shadow-lg shadow-[#34C759]/10"}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={isMobile ? "text-[10px] sm:text-sm text-black/40 dark:text-white/40" : "text-sm text-black/40 dark:text-white/40"}>总消息数</p>
                    <p className={isMobile ? "text-xl sm:text-2xl font-bold text-[#34C759]" : "text-3xl font-bold text-[#34C759]"}>{dashboard?.totalMessages || 0}</p>
                  </div>
                  <div className={isMobile ? "w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-[#34C759]/10 flex items-center justify-center" : "w-12 h-12 rounded-xl bg-[#34C759]/10 flex items-center justify-center"}>
                    <MessageCircle size={isMobile ? 18 : 24} className="text-[#34C759]" />
                  </div>
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={isMobile ? "bg-white dark:bg-[#1A1D21] rounded-xl p-3 sm:p-4 shadow-lg shadow-[#FF9500]/10" : "bg-white dark:bg-[#1A1D21] rounded-2xl p-6 shadow-lg shadow-[#FF9500]/10"}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={isMobile ? "text-[10px] sm:text-sm text-black/40 dark:text-white/40" : "text-sm text-black/40 dark:text-white/40"}>总动态数</p>
                    <p className={isMobile ? "text-xl sm:text-2xl font-bold text-[#FF9500]" : "text-3xl font-bold text-[#FF9500]"}>{dashboard?.totalMoments || 0}</p>
                  </div>
                  <div className={isMobile ? "w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-[#FF9500]/10 flex items-center justify-center" : "w-12 h-12 rounded-xl bg-[#FF9500]/10 flex items-center justify-center"}>
                    <Globe size={isMobile ? 18 : 24} className="text-[#FF9500]" />
                  </div>
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={isMobile ? "bg-white dark:bg-[#1A1D21] rounded-xl p-3 sm:p-4 shadow-lg shadow-[#AF52DE]/10" : "bg-white dark:bg-[#1A1D21] rounded-2xl p-6 shadow-lg shadow-[#AF52DE]/10"}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={isMobile ? "text-[10px] sm:text-sm text-black/40 dark:text-white/40" : "text-sm text-black/40 dark:text-white/40"}>总会话数</p>
                    <p className={isMobile ? "text-xl sm:text-2xl font-bold text-[#AF52DE]" : "text-3xl font-bold text-[#AF52DE]"}>{dashboard?.totalConversations || 0}</p>
                  </div>
                  <div className={isMobile ? "w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-[#AF52DE]/10 flex items-center justify-center" : "w-12 h-12 rounded-xl bg-[#AF52DE]/10 flex items-center justify-center"}>
                    <MessageSquare size={isMobile ? 18 : 24} className="text-[#AF52DE]" />
                  </div>
                </div>
              </motion.div>
            </div>

            <div className={isMobile ? "grid grid-cols-1 gap-3 sm:gap-4" : "grid grid-cols-1 lg:grid-cols-2 gap-6"}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className={isMobile ? "bg-white dark:bg-[#1A1D21] rounded-xl p-3 sm:p-4 shadow-lg" : "bg-white dark:bg-[#1A1D21] rounded-2xl p-6 shadow-lg"}>
                <h3 className={isMobile ? "text-sm font-semibold text-black dark:text-white mb-3" : "text-lg font-semibold text-black dark:text-white mb-4"}>用户统计</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: '在线用户', value: userStats?.online || 0 },
                          { name: '管理员', value: userStats?.admins || 0 },
                          { name: '普通用户', value: userStats?.normal || 0 }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {[0, 1, 2].map((index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white dark:bg-[#1A1D21] rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-black dark:text-white mb-4">会话分布</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={messageStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#007AFF" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white dark:bg-[#1A1D21] rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5">
                    <th className="text-left px-4 py-4 text-sm font-semibold text-black/60 dark:text-white/60">用户</th>
                    <th className="text-left px-4 py-4 text-sm font-semibold text-black/60 dark:text-white/60">邮箱</th>
                    <th className="text-left px-4 py-4 text-sm font-semibold text-black/60 dark:text-white/60">角色</th>
                    <th className="text-left px-4 py-4 text-sm font-semibold text-black/60 dark:text-white/60">状态</th>
                    <th className="text-left px-4 py-4 text-sm font-semibold text-black/60 dark:text-white/60">IP</th>
                    <th className="text-left px-4 py-4 text-sm font-semibold text-black/60 dark:text-white/60">动态</th>
                    <th className="text-left px-4 py-4 text-sm font-semibold text-black/60 dark:text-white/60">消息</th>
                    <th className="text-left px-4 py-4 text-sm font-semibold text-black/60 dark:text-white/60">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center text-white font-semibold">
                            {u.nickname?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-medium text-black dark:text-white">{u.nickname || u.username}</p>
                            <p className="text-xs text-black/40 dark:text-white/40">@{u.nickname}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-black/60 dark:text-white/60">{u.email || '-'}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          u.role === 'admin' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                          u.role === 'tech_god' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                          'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {u.role === 'admin' ? '管理员' : u.role === 'tech_god' ? '技术' : '用户'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          u.ban_status === 'banned' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                          {u.ban_status === 'banned' ? '已封禁' : '正常'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-black/60 dark:text-white/60 font-mono">{u.last_ip || '-'}</td>
                      <td className="px-4 py-4 text-sm text-black/60 dark:text-white/60">{u.moments_count || 0}</td>
                      <td className="px-4 py-4 text-sm text-black/60 dark:text-white/60">{u.message_count || 0}</td>
                      <td className="px-4 py-4">
                        <div className="relative">
                          <button
                            onClick={() => setActionMenu(actionMenu === u.id ? null : u.id)}
                            className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <Settings size={16} className="text-black/60 dark:text-white/60" />
                          </button>
                          <AnimatePresence>
                            {actionMenu === u.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute right-0 top-12 w-48 bg-white dark:bg-[#1A1D21] rounded-xl shadow-xl border border-black/10 dark:border-white/10 overflow-hidden z-50"
                              >
                                <button
                                  onClick={() => { handleSetRole(u.id, 'admin'); setActionMenu(null); }}
                                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                >
                                  <Crown size={14} className="text-purple-500" />设为管理员
                                </button>
                                <button
                                  onClick={() => { handleSetRole(u.id, 'user'); setActionMenu(null); }}
                                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                >
                                  <Users size={14} className="text-blue-500" />设为普通用户
                                </button>
                                <div className="border-t border-black/10 dark:border-white/10" />
                                {u.ban_status !== 'banned' ? (
                                  <button
                                    onClick={() => { setBanModal({ userId: u.id, username: u.nickname || u.username, isBanned: true }); setActionMenu(null); }}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                  >
                                    <Ban size={14} className="text-orange-500" />封号
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => { setBanModal({ userId: u.id, username: u.nickname || u.username, isBanned: false }); setActionMenu(null); }}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                  >
                                    <Unlock size={14} className="text-green-500" />解封
                                  </button>
                                )}
                                <div className="border-t border-black/10 dark:border-white/10" />
                                <button
                                  onClick={() => { handleDeleteUser(u.id); setActionMenu(null); }}
                                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-red-500"
                                >
                                  <Trash2 size={14} />删除用户
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'conversations' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-[#1A1D21] rounded-2xl overflow-hidden shadow-lg">
              <div className="p-4 border-b border-black/5 dark:border-white/10">
                <h3 className="font-semibold text-black dark:text-white">会话列表</h3>
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                {conversations.filter(c => c.type === 'single').map((c) => (
                  <div
                    key={c.id}
                    onClick={() => { setSelectedConversation(c.id); loadMessages(c.id); }}
                    className={`p-4 border-b border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors ${selectedConversation === c.id ? 'bg-[#007AFF]/5' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#007AFF]/10 flex items-center justify-center">
                          <MessageSquare size={18} className="text-[#007AFF]" />
                        </div>
                        <div>
                          <p className="font-medium text-black dark:text-white">会话 #{c.id}</p>
                          <p className="text-xs text-black/40 dark:text-white/40">{c.type === 'single' ? '私聊' : '群聊'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-black/60 dark:text-white/60">{c.message_count || 0} 条消息</p>
                        <p className="text-xs text-black/40 dark:text-white/40">{c.last_message_time ? new Date(c.last_message_time).toLocaleString() : '-'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-[#1A1D21] rounded-2xl overflow-hidden shadow-lg">
              <div className="p-4 border-b border-black/5 dark:border-white/10">
                <h3 className="font-semibold text-black dark:text-white">
                  聊天记录 {selectedConversation && `#${selectedConversation}`}
                </h3>
              </div>
              <div className="max-h-[500px] overflow-y-auto p-4 space-y-4">
                {selectedConversation ? (
                  messages.length > 0 ? (
                    messages.map((m) => (
                      <div key={m.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#007AFF]/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs text-[#007AFF] font-medium">{(m.sender_nickname || 'U')[0]?.toUpperCase()}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm text-black dark:text-white">{m.sender_nickname || 'Unknown'}</span>
                            <span className="text-xs text-black/40 dark:text-white/40">{new Date(m.created_at).toLocaleString()}</span>
                          </div>
                          <div className="bg-black/5 dark:bg-white/5 rounded-xl px-3 py-2 inline-block">
                            <p className="text-sm text-black dark:text-white">{m.content}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-black/40 dark:text-white/40 py-8">暂无消息</div>
                  )
                ) : (
                  <div className="text-center text-black/40 dark:text-white/40 py-8">请选择左侧会话</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'moments' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-[#1A1D21] rounded-2xl overflow-hidden shadow-lg">
              <div className="p-4 border-b border-black/5 dark:border-white/10">
                <h3 className="font-semibold text-black dark:text-white">朋友圈动态</h3>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {moments.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => { setSelectedMoment(m); loadMomentComments(m.id); }}
                    className={`p-4 border-b border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors ${selectedMoment?.id === m.id ? 'bg-[#007AFF]/5' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center text-white font-semibold">
                        {m.nickname?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-black dark:text-white">{m.nickname || m.username}</span>
                          <span className="text-xs text-black/40 dark:text-white/40">{new Date(m.created_at).toLocaleString()}</span>
                        </div>
                        <p className="mt-1 text-sm text-black/80 dark:text-white/80 line-clamp-2">{m.content}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-black/40 dark:text-white/40">
                          <span>👍 {m.likes_count || 0}</span>
                          <span>💬 {m.comments_count || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-[#1A1D21] rounded-2xl overflow-hidden shadow-lg">
              <div className="p-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
                <h3 className="font-semibold text-black dark:text-white">动态详情与评论</h3>
                {selectedMoment && (
                  <button
                    onClick={() => handleDeleteMoment(selectedMoment.id)}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <div className="max-h-[600px] overflow-y-auto p-4">
                {selectedMoment ? (
                  <div className="space-y-4">
                    <div className="bg-black/5 dark:bg-white/5 rounded-xl p-4">
                      <p className="text-black dark:text-white whitespace-pre-wrap">{selectedMoment.content}</p>
                    </div>
                    <div className="border-t border-black/5 dark:border-white/10 pt-4">
                      <h4 className="font-medium text-black dark:text-white mb-3">评论 ({momentComments.length})</h4>
                      {momentComments.length > 0 ? (
                        <div className="space-y-3">
                          {momentComments.map((c) => (
                            <div key={c.id} className="flex items-start gap-2">
                              <div className="w-6 h-6 rounded-full bg-[#007AFF]/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-[10px] text-[#007AFF]">{(c.nickname || 'U')[0]?.toUpperCase()}</span>
                              </div>
                              <div className="flex-1 bg-black/5 dark:bg-white/5 rounded-lg px-3 py-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-black dark:text-white">{c.nickname || c.username}</span>
                                  <button onClick={() => handleDeleteComment(c.id)} className="text-black/30 hover:text-red-500">
                                    <X size={12} />
                                  </button>
                                </div>
                                <p className="text-sm text-black/80 dark:text-white/80">{c.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-black/40 dark:text-white/40 text-center py-4">暂无评论</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-black/40 dark:text-white/40 py-8">请选择左侧动态</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tables' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-[#1A1D21] rounded-2xl overflow-hidden shadow-lg">
              <div className="p-4 border-b border-black/5 dark:border-white/10">
                <h3 className="font-semibold text-black dark:text-white">数据表</h3>
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                {tables.map((table) => (
                  <button
                    key={table.TABLE_NAME}
                    onClick={() => loadTableData(table.TABLE_NAME)}
                    className={`w-full flex items-center justify-between p-4 border-b border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${selectedTable === table.TABLE_NAME ? 'bg-[#007AFF]/5' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <Database size={16} className="text-[#007AFF]" />
                      <span className="font-mono text-sm text-black dark:text-white">{table.TABLE_NAME}</span>
                    </div>
                    <span className="text-xs text-black/40 dark:text-white/40">{table.TABLE_ROWS || 0}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white dark:bg-[#1A1D21] rounded-2xl overflow-hidden shadow-lg">
              <div className="p-4 border-b border-black/5 dark:border-white/10">
                <h3 className="font-semibold text-black dark:text-white">
                  {selectedTable ? `表: ${selectedTable}` : '请选择左侧数据表'}
                </h3>
              </div>
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                {selectedTable && tableData.length > 0 ? (
                  <table className="w-full">
                    <thead className="sticky top-0 bg-black/5 dark:bg-white/5">
                      <tr>
                        {Object.keys(tableData[0]).map((key) => (
                          <th key={key} className="text-left px-4 py-3 text-xs font-semibold text-black/60 dark:text-white/60 whitespace-nowrap">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.map((row, idx) => (
                        <tr key={idx} className="border-b border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5">
                          {Object.values(row).map((val: any, i) => (
                            <td key={i} className="px-4 py-2 text-sm text-black/80 dark:text-white/80 whitespace-nowrap max-w-[200px] truncate">
                              {typeof val === 'object' ? JSON.stringify(val) : String(val ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : selectedTable ? (
                  <div className="text-center text-black/40 dark:text-white/40 py-8">暂无数据</div>
                ) : (
                  <div className="text-center text-black/40 dark:text-white/40 py-8">请选择左侧数据表</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-[#1A1D21] rounded-2xl overflow-hidden shadow-lg">
              <div className="p-4 border-b border-black/5 dark:border-white/10">
                <h3 className="font-semibold text-black dark:text-white">群组列表</h3>
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                {groups.map((g) => (
                  <div
                    key={g.id}
                    onClick={() => { setSelectedGroup(g); loadGroupMembers(g.id); }}
                    className={`p-4 border-b border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors ${selectedGroup?.id === g.id ? 'bg-[#007AFF]/5' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5856D6] to-[#007AFF] flex items-center justify-center">
                          <Users size={18} className="text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-black dark:text-white">{g.name}</p>
                          <p className="text-xs text-black/40 dark:text-white/40">@{g.owner_name || g.owner_username || 'unknown'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-black/60 dark:text-white/60">{g.member_count || 0} 成员</p>
                        {g.pending_requests > 0 && (
                          <span className="text-xs text-orange-500">{g.pending_requests} 待审核</span>
                        )}
                      </div>
                    </div>
                    {g.description && (
                      <p className="mt-2 text-xs text-black/40 dark:text-white/40 line-clamp-1">{g.description}</p>
                    )}
                  </div>
                ))}
                {groups.length === 0 && (
                  <div className="text-center text-black/40 dark:text-white/40 py-8">暂无群组</div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-[#1A1D21] rounded-2xl overflow-hidden shadow-lg">
              <div className="p-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
                <h3 className="font-semibold text-black dark:text-white">
                  群组成员 {selectedGroup && `(${selectedGroup.name})`}
                </h3>
                {selectedGroup && (
                  <button
                    onClick={() => handleDeleteGroup(selectedGroup.id)}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                {selectedGroup ? (
                  groupMembers.length > 0 ? (
                    groupMembers.map((m) => (
                      <div key={m.id} className="flex items-center gap-3 p-4 border-b border-black/5 dark:border-white/10">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center text-white font-semibold">
                          {m.nickname?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-black dark:text-white">{m.nickname || m.username}</span>
                            {m.role === 'owner' && <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs rounded">群主</span>}
                            {m.role === 'admin' && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 text-xs rounded">管理员</span>}
                          </div>
                          <p className="text-xs text-black/40 dark:text-white/40">{m.email}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          m.status === 'active' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                          'bg-gray-100 text-gray-500 dark:bg-gray-900/30 dark:text-gray-400'
                        }`}>
                          {m.status === 'active' ? '正常' : '已退出'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-black/40 dark:text-white/40 py-8">暂无成员</div>
                  )
                ) : (
                  <div className="text-center text-black/40 dark:text-white/40 py-8">请选择左侧群组</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {banModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setBanModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#1A1D21] rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
                {banModal.isBanned ? '解封用户' : '封禁用户'}
              </h3>
              <p className="text-sm text-black/60 dark:text-white/60 mb-4">
                {banModal.isBanned ? `确定要解封用户 "${banModal.username}" 吗？` : `确定要封禁用户 "${banModal.username}" 吗？`}
              </p>
              {!banModal.isBanned && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-black/60 dark:text-white/60 mb-2">封禁时长</label>
                  <select
                    value={banDuration}
                    onChange={(e) => setBanDuration(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-transparent text-black dark:text-white"
                  >
                    <option value="1">1 天</option>
                    <option value="7">7 天</option>
                    <option value="30">30 天</option>
                    <option value="365">永久</option>
                  </select>
                </div>
              )}
              {!banModal.isBanned && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-black/60 dark:text-white/60 mb-2">封禁原因</label>
                  <input
                    type="text"
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="请输入封禁原因"
                    className="w-full px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-transparent text-black dark:text-white"
                  />
                </div>
              )}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setBanModal(null)}
                  className="px-4 py-2 text-sm text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleBanUser}
                  className={`px-4 py-2 text-sm text-white rounded-xl transition-colors ${banModal.isBanned ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
                >
                  {banModal.isBanned ? '确认解封' : '确认封禁'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ToastContainer />
    </div>
  );
}