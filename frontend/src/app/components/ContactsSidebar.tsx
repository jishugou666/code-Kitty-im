import { Search, UserPlus, Check, X, Users, Shield } from "lucide-react";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useContactStore } from '../../store/contactStore';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';
import { SearchModal } from './SearchModal';
import { GroupSearchModal } from './GroupSearchModal';
import { groupApi } from '../../api/group';
import { useTranslation } from 'react-i18next';

export function ContactsSidebar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showGroupSearchModal, setShowGroupSearchModal] = useState(false);
  const { user } = useAuthStore();
  const { contacts, pendingRequests, fetchContacts, fetchPendingRequests, acceptContact, rejectContact } = useContactStore();
  const { toast, ToastContainer } = useToast();
  const [groupRequests, setGroupRequests] = useState<any[]>([]);
  const [myGroups, setMyGroups] = useState<any[]>([]);

  useEffect(() => {
    fetchContacts();
    fetchPendingRequests();
    fetchGroupRequests();
    fetchMyGroups();
    const interval = setInterval(() => {
      fetchContacts();
      fetchPendingRequests();
      fetchGroupRequests();
      fetchMyGroups();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchContacts, fetchPendingRequests]);

  const fetchGroupRequests = async () => {
    try {
      const res = await groupApi.getList();
      if (res.code === 200) {
        const ownedGroups = (res.data || []).filter((g: any) => g.my_role === 'owner' || g.my_role === 'admin');
        const requestsPromises = ownedGroups.map(async (g: any) => {
          const reqRes = await groupApi.getJoinRequests(g.id);
          if (reqRes.code === 200) {
            return (reqRes.data || []).map((r: any) => ({ ...r, groupName: g.name }));
          }
          return [];
        });
        const allRequests = await Promise.all(requestsPromises);
        setGroupRequests(allRequests.flat());
      }
    } catch (error) {
      console.error('Failed to fetch group requests:', error);
    }
  };

  const fetchMyGroups = async () => {
    try {
      const res = await groupApi.getList();
      if (res.code === 200) {
        setMyGroups(res.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch my groups:', error);
    }
  };

  const handleGroupJoinRequest = async (requestId: number, groupId: number, approved: boolean) => {
    try {
      const res = await groupApi.handleJoinRequest(groupId, requestId, approved);
      if (res.code === 200) {
        toast(approved ? '已通过' : '已拒绝', 'success');
        fetchGroupRequests();
      }
    } catch (error) {
      toast('操作失败', 'error');
    }
  };

  const handleAcceptContact = async (userId: number) => {
    try {
      await acceptContact(userId);
      fetchContacts();
      toast(t('contacts.addSuccess'), 'success');
    } catch (error) {
      console.error('Failed to accept contact:', error);
    }
  };

  const handleRejectContact = async (userId: number) => {
    try {
      await rejectContact(userId);
    } catch (error) {
      console.error('Failed to reject contact:', error);
    }
  };

  const handleStartChat = async (contactUserId: number) => {
    try {
      const response = await import('../../api/conversation').then(m => m.conversationApi).then(api => api.createSingle(contactUserId));
      const conversationId = response.data.id;
      navigate(`/chat/${conversationId}`);
    } catch (error) {
      console.error('Failed to start chat:', error);
    }
  };

  const groupContactsByLetter = (contacts: any[]) => {
    const grouped: Record<string, any[]> = {};
    contacts.forEach(contact => {
      const letter = (contact.nickname || contact.username || 'U')[0].toUpperCase();
      if (!grouped[letter]) grouped[letter] = [];
      grouped[letter].push(contact);
    });
    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
  };

  const groupedContacts = groupContactsByLetter(contacts);

  return (
    <div className="flex flex-col h-full bg-transparent relative">
      <div className="sticky top-0 z-40 bg-white/60 dark:bg-[#13161A]/60 backdrop-blur-3xl pt-8 pb-4 px-4 border-b border-black/5 dark:border-white/5 flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <h1 className="text-xl font-semibold text-black dark:text-white tracking-tight">{t('contacts.title')}</h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowGroupSearchModal(true)}
              className="text-[#007AFF] hover:bg-[#007AFF]/10 p-2 rounded-full transition-colors"
              title="搜索群组"
            >
              <Shield size={18} strokeWidth={2} />
            </button>
            <button
              onClick={() => setShowSearchModal(true)}
              className="text-[#007AFF] hover:bg-[#007AFF]/10 p-2 rounded-full transition-colors"
              title={t('contacts.searchUsers')}
            >
              <UserPlus size={18} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-6 scrollbar-hide">
        <div className="mb-2">
          <div className="sticky top-0 z-30 bg-white/80 dark:bg-[#13161A]/80 backdrop-blur-md px-5 py-1.5 border-b border-black/[0.04] dark:border-white/[0.04] flex items-center gap-4">
            <Users size={14} className="text-[#007AFF]" />
            <span className="text-[12px] font-bold text-[#007AFF]">
              {t('contacts.friendRequest')} ({pendingRequests.length})
            </span>
          </div>
          <div className="px-2 pt-1">
            {pendingRequests.length === 0 ? (
              <div className="text-center text-black/40 dark:text-white/40 text-sm py-4">
                {t('contacts.noFriendRequest')}
              </div>
            ) : (
              pendingRequests.map((contact) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 py-2 px-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-[14px] cursor-pointer transition-colors group"
                >
                  <div className="relative">
                    {contact.avatar ? (
                      <img src={contact.avatar} alt={contact.nickname} className="w-[42px] h-[42px] rounded-full object-cover shadow-sm" />
                    ) : (
                      <div className="w-[42px] h-[42px] rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center text-white font-semibold">
                        {(contact.nickname || contact.username || 'U')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <h3 className="text-[15px] font-medium text-black dark:text-white truncate">
                      {contact.nickname || contact.username}
                    </h3>
                    <p className="text-[12px] text-black/40 dark:text-white/40 truncate">
                      @{contact.nickname}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAcceptContact(contact.id)}
                      className="p-2 bg-[#34C759] hover:bg-[#2db84d] text-white rounded-full transition-colors"
                      title={t('contacts.accept')}
                    >
                      <Check size={14} strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={() => handleRejectContact(contact.id)}
                      className="p-2 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-black dark:text-white rounded-full transition-colors"
                      title={t('contacts.reject')}
                    >
                      <X size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {groupRequests.length > 0 && (
          <div className="mb-2">
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-[#13161A]/80 backdrop-blur-md px-5 py-1.5 border-b border-black/[0.04] dark:border-white/[0.04] flex items-center gap-4">
              <Shield size={14} className="text-orange-500" />
              <span className="text-[12px] font-bold text-orange-500">
                加群申请 ({groupRequests.length})
              </span>
            </div>
            <div className="px-2 pt-1">
              {groupRequests.map((request) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 py-2 px-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-[14px] cursor-pointer transition-colors group"
                >
                  <div className="w-[42px] h-[42px] rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-semibold">
                    {(request.nickname || request.username || 'U')[0].toUpperCase()}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <h3 className="text-[15px] font-medium text-black dark:text-white truncate">
                      {request.nickname || request.username}
                    </h3>
                    <p className="text-[12px] text-black/40 dark:text-white/40 truncate">
                      申请加入 {request.groupName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleGroupJoinRequest(request.id, request.group_id, true)}
                      className="p-2 bg-[#34C759] hover:bg-[#2db84d] text-white rounded-full transition-colors"
                      title="通过"
                    >
                      <Check size={14} strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={() => handleGroupJoinRequest(request.id, request.group_id, false)}
                      className="p-2 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-black dark:text-white rounded-full transition-colors"
                      title="拒绝"
                    >
                      <X size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {myGroups.length > 0 && (
          <div className="mb-2">
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-[#13161A]/80 backdrop-blur-md px-5 py-1.5 border-b border-black/[0.04] dark:border-white/[0.04] flex items-center gap-4">
              <Users size={14} className="text-purple-500" />
              <span className="text-[12px] font-bold text-purple-500">
                我的群组 ({myGroups.length})
              </span>
            </div>
            <div className="px-2 pt-1">
              {myGroups.map((group) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => navigate(`/chat/${group.id}`)}
                  className="flex items-center gap-3 py-2 px-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-[14px] cursor-pointer transition-colors group"
                >
                  <div className="w-[42px] h-[42px] rounded-xl bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center text-white font-semibold transition-transform group-hover:scale-105">
                    <Users size={20} />
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[15px] font-medium text-black dark:text-white truncate">
                        {group.name}
                      </h3>
                      {group.my_role === 'owner' && <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] rounded">群主</span>}
                      {group.my_role === 'admin' && <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[10px] rounded">管理员</span>}
                    </div>
                    <p className="text-[12px] text-black/40 dark:text-white/40 truncate">
                      {group.member_count} 位成员
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {groupedContacts.map(([letter, contactsGroup]) => (
          <div key={letter} className="mb-2">
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-[#13161A]/80 backdrop-blur-md px-5 py-1.5 border-b border-black/[0.04] dark:border-white/[0.04] flex items-center gap-4">
              <span className="text-[12px] font-bold text-black/40 dark:text-white/40 w-4 text-center">
                {letter}
              </span>
            </div>
            <div className="px-2 pt-1">
              {contactsGroup.map((contact, index) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleStartChat(contact.id)}
                  className="flex items-center gap-3 py-2 px-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-[14px] cursor-pointer transition-colors group"
                >
                  <div className="relative">
                    {contact.avatar ? (
                      <img src={contact.avatar} alt={contact.nickname} className="w-[42px] h-[42px] rounded-full object-cover shadow-sm transition-transform group-hover:scale-105" />
                    ) : (
                      <div className="w-[42px] h-[42px] rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center text-white font-semibold transition-transform group-hover:scale-105">
                        {(contact.nickname || contact.username || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    {contact.status === 1 && (
                      <div className="absolute bottom-0 right-0 w-[12px] h-[12px] bg-[#34C759] border-2 border-white dark:border-[#13161A] rounded-full" />
                    )}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <h3 className="text-[15px] font-medium text-black dark:text-white truncate">
                      {contact.nickname || contact.username}
                    </h3>
                    <p className={`text-[12px] truncate ${contact.status === 1 ? 'text-[#34C759]' : 'text-black/40 dark:text-white/40'}`}>
                      {contact.status === 1 ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}

        {contacts.length === 0 && pendingRequests.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-black/40 dark:text-white/40 text-sm">
            <p>{t('contacts.noResults')}</p>
            <button
              onClick={() => setShowSearchModal(true)}
              className="mt-2 text-[#007AFF] hover:underline text-xs"
            >
              {t('contacts.searchUsers')}
            </button>
          </div>
        )}
      </div>

      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onAddSuccess={() => {
          fetchContacts();
          fetchPendingRequests();
        }}
      />
      <GroupSearchModal
        isOpen={showGroupSearchModal}
        onClose={() => setShowGroupSearchModal(false)}
      />
      <ToastContainer />
    </div>
  );
}