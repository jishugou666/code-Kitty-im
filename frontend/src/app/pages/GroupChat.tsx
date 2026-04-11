 import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, MoreHorizontal, Plus, Paperclip, BarChart2, Smile, Mic, Phone, Video, Send, Users, X, ChevronRight, Image } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useRef, useEffect } from "react";
import { clsx } from "clsx";
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { useContactStore } from '../../store/contactStore';
import { conversationApi } from '../../api/conversation';
import { userApi } from '../../api/user';
import { messageApi } from '../../api/message';
import { groupApi } from '../../api/group';
import { uploadApi } from '../../api/upload';
import { useToast } from '../../hooks/useToast';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useIsMobile } from '../components/ui/use-mobile';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export function GroupChat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const conversationId = parseInt(id || '0');
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [groupInfo, setGroupInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showMemberMenu, setShowMemberMenu] = useState(false);
  const [memberMenuPos, setMemberMenuPos] = useState({ x: 0, y: 0 });
  const [muteMinutes, setMuteMinutes] = useState(0);
  const [showMuteModal, setShowMuteModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [viewerImage, setViewerImage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, token } = useAuthStore();
  const { conversations, fetchConversations } = useChatStore();
  const { contacts, fetchContacts } = useContactStore();
  const { toast, ToastContainer } = useToast();
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useWebSocket(conversationId, (newMessage) => {
    if (newMessage.type === 'recalled') {
      setMessages(prev => prev.map(m =>
        m.id === newMessage.id
          ? { ...m, type: 'recalled', content: '此消息已撤回' }
          : m
      ));
    } else if (newMessage.type === 'message-deleted') {
      setMessages(prev => prev.filter(m => m.id !== newMessage.messageId));
    } else if (newMessage.type === 'messages-deleted') {
      setMessages(prev => prev.filter(m => m.sender_id !== newMessage.userId));
    } else {
      setMessages(prev => {
        if (prev.some(m => m.id === newMessage.id)) {
          return prev;
        }
        return [...prev, newMessage];
      });
    }
  });

  const conversation = conversations.find(c => c.id === conversationId);

  useEffect(() => {
    if (conversationId && token) {
      loadGroupInfo();
      loadMessages();
    }
  }, [conversationId, token]);

  const loadGroupInfo = async () => {
    try {
      const res = await groupApi.getInfo(conversationId);
      if (res.code === 200 && res.data) {
        setGroupInfo(res.data);
      }
    } catch (error) {
      console.error('Failed to load group info:', error);
    }
  };

  const myRole = groupInfo?.role || 'member';

  const loadMessages = async () => {
    if (!conversationId || !token) return;
    setIsLoading(true);
    try {
      const timestamp = Date.now();
      const response = await fetch(`${API_BASE_URL}/message/list?conversationId=${conversationId}&t=${timestamp}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      const data = await response.json();
      if (data.code === 200 && Array.isArray(data.data)) {
        setMessages(data.data || []);
        messageApi.markAsRead(conversationId);
        fetchConversations();
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !conversationId || !token) return;

    const text = input.trim();
    setInput("");

    try {
      const response = await fetch(`${API_BASE_URL}/message/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          conversationId,
          content: text,
          type: 'text'
        })
      });
      const data = await response.json();
      if ((data.code === 200 || data.code === 201) && data.data) {
        setMessages(prev => [...(prev || []), data.data]);
        fetchConversations();
      } else if (data.code === 429 && data.data?.blocked) {
        toast(`⛔ ${data.data.details || '消息被拦截'}`, 'warning');
      } else {
        toast(data.msg || '发送失败', 'error');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast('发送失败', 'error');
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversationId || !token) return;

    if (!file.type.startsWith('image/')) {
      toast('只支持图片文件', 'info');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (!base64) return;

      setPreviewImage(base64);

      try {
        const uploadRes = await uploadApi.uploadImage(base64);
        if (uploadRes.code !== 200 || !uploadRes.data?.url) {
          toast(uploadRes.msg || '图片上传失败', 'error');
          setPreviewImage(null);
          return;
        }

        const imageUrl = uploadRes.data.url;

        const response = await fetch(`${API_BASE_URL}/message/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            conversationId,
            content: imageUrl,
            type: 'image'
          })
        });
        const data = await response.json();

        if ((data.code === 200 || data.code === 201) && data.data) {
          setMessages(prev => [...(prev || []), data.data]);
          fetchConversations();
        } else {
          toast(data.msg || '发送失败', 'error');
        }
      } catch (error) {
        console.error('Failed to send image:', error);
        toast('发送失败', 'error');
      } finally {
        setPreviewImage(null);
      }
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setShowAttachMenu(false);
  };

  const handleSearchUser = async (keyword: string) => {
    if (keyword.trim().length < 1) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await userApi.searchUsers(keyword);
      const existingMemberIds = (groupInfo?.members || []).map((m: any) => m?.id);
      setSearchResults(Array.isArray(response.data) ? response.data.filter((u: any) => !existingMemberIds.includes(u?.id)) : []);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleAddMember = async (userId: number) => {
    try {
      await conversationApi.addMembers(conversationId, [userId]);
      loadGroupInfo();
      setShowAddMember(false);
      setSearchResults([]);
      toast('添加成功', 'success');
    } catch (error) {
      console.error('Failed to add member:', error);
      toast('添加失败', 'error');
    }
  };

  const formatTime = (timeStr: string | undefined | null) => {
    if (!timeStr) return '';
    try {
      const date = new Date(timeStr);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } catch { return ''; }
  };

  const isAdmin = groupInfo?.role === 'owner' || groupInfo?.role === 'admin';
  const onlineCount = (groupInfo?.members || []).filter((m: any) => m?.status === 1).length;
  const totalCount = (groupInfo?.members || []).length;

  const safeMessages = Array.isArray(messages) ? messages : [];

  return (
    <div className="flex flex-col h-full bg-[#FAFAFC] dark:bg-[#0A0C10] relative overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/70 dark:bg-[#13161A]/70 backdrop-blur-3xl pt-6 pb-4 px-8 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4 cursor-pointer">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-black dark:text-white" />
          </button>
          <div>
            <h2 className="text-[17px] font-semibold text-black dark:text-white">
              {groupInfo?.name || conversation?.name || t('chat.groupName')}
            </h2>
            <p className="text-[13px] text-black/40 dark:text-white/40">{totalCount} {t('chat.members')} - {onlineCount} {t('chat.online')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
            <Phone size={20} />
          </button>
          <button className="p-2.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
            <Video size={20} />
          </button>
          <button onClick={() => setShowMembers(!showMembers)} className="p-2.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
            <Users size={20} />
          </button>
          <button className="p-2.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>

      {/* Members Panel */}
      <AnimatePresence>
        {showMembers && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute top-0 right-0 bottom-0 w-[320px] bg-white dark:bg-[#13161A] z-50 shadow-[-8px_0_32px_rgba(0,0,0,0.1)] border-l border-black/5 dark:border-white/5 overflow-y-auto"
          >
            <div className="sticky top-0 z-10 bg-white dark:bg-[#13161A] p-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-black dark:text-white">Members</h2>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button onClick={() => setShowAddMember(true)} className="p-2 bg-[#007AFF] hover:bg-[#006CE0] text-white rounded-full transition-colors">
                    <Plus size={16} />
                  </button>
                )}
                <button onClick={() => setShowMembers(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-2">
              {Array.isArray(groupInfo?.members) && groupInfo.members.map((member: any) => {
                const memberId = member.user_id || member.id;
                return (
                <div
                  key={memberId || Math.random()}
                  onClick={() => {
                    if ((myRole === 'owner' || myRole === 'admin') && member.my_role !== 'owner') {
                      setSelectedMember({ ...member, user_id: memberId });
                      setShowMemberMenu(true);
                      setMemberMenuPos({ x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 - 100 });
                    }
                  }}
                  className={`p-3 rounded-xl transition-all cursor-pointer border-2 ${
                    (myRole === 'owner' || myRole === 'admin') && member.my_role !== 'owner'
                      ? 'border-transparent hover:border-[#007AFF]/30 hover:bg-[#007AFF]/5 active:bg-[#007AFF]/10'
                      : 'border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      {member?.avatar ? (
                        <img src={member.avatar} alt={member?.nickname || 'User'} className="w-12 h-12 rounded-full object-cover ring-2 ring-white dark:ring-[#13161A]" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center text-white font-bold text-lg ring-2 ring-white dark:ring-[#13161A]">
                          {(member?.nickname || member?.username || 'U')[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                      {member?.status === 1 && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#34C759] border-2 border-white dark:border-[#13161A] rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-[15px] text-black dark:text-white truncate">
                          {member?.nickname || member?.username || 'Unknown'}
                        </p>
                        {member.is_muted === 1 && (
                          <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">已禁言</span>
                        )}
                      </div>
                      <p className="text-xs text-black/40 dark:text-white/40 truncate">@{member?.nickname || '未知'}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {member.my_role === 'owner' && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#007AFF] bg-[#007AFF]/10 px-2 py-1 rounded-lg">群主</span>
                      )}
                      {member.my_role === 'admin' && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-500 bg-purple-500/10 px-2 py-1 rounded-lg">管理员</span>
                      )}
                      {(myRole === 'owner' || myRole === 'admin') && member.my_role !== 'owner' && (
                        <ChevronRight size={16} className="text-black/30 dark:text-white/30" />
                      )}
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Member Action Menu */}
      <AnimatePresence>
        {showMemberMenu && selectedMember && (
          <div className="absolute inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowMemberMenu(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white/90 dark:bg-[#1A1D21]/90 backdrop-blur-xl rounded-2xl shadow-2xl w-80 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 flex flex-col items-center border-b border-black/5 dark:border-white/10">
                <div className="relative mb-3">
                  {selectedMember?.avatar ? (
                    <img src={selectedMember.avatar} alt={selectedMember?.nickname || 'User'} className="w-16 h-16 rounded-full object-cover ring-4 ring-[#007AFF]/20" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center text-white font-bold text-2xl ring-4 ring-[#007AFF]/20">
                      {(selectedMember?.nickname || selectedMember?.username || 'U')[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  {selectedMember?.status === 1 && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-[#34C759] border-2 border-white dark:border-[#1A1D21] rounded-full" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-black dark:text-white">{selectedMember?.nickname || selectedMember?.username || '未知'}</h3>
                <p className="text-sm text-black/40 dark:text-white/40">@{selectedMember?.nickname || '未知'}</p>
                {selectedMember.my_role === 'owner' && (
                  <span className="mt-2 text-xs font-bold uppercase tracking-wider text-[#007AFF] bg-[#007AFF]/10 px-3 py-1 rounded-full">群主</span>
                )}
                {selectedMember.my_role === 'admin' && (
                  <span className="mt-2 text-xs font-bold uppercase tracking-wider text-purple-500 bg-purple-500/10 px-3 py-1 rounded-full">管理员</span>
                )}
                {selectedMember.is_muted === 1 && (
                  <span className="mt-2 text-xs font-bold uppercase tracking-wider text-red-500 bg-red-500/10 px-3 py-1 rounded-full">已禁言</span>
                )}
              </div>

              <div className="p-2">
                {myRole === 'owner' && selectedMember.my_role !== 'owner' && (
                  <button
                    onClick={async () => {
                      try {
                        const isAdmin = selectedMember.my_role === 'admin';
                        const res = await groupApi.setAdmin(conversationId, selectedMember.user_id, !isAdmin);
                        if (res.code === 200) {
                          toast(isAdmin ? '已取消管理员' : '已设为管理员', 'success');
                          setGroupInfo((prev: any) => ({
                            ...prev,
                            members: prev.members.map((m: any) =>
                              m.user_id === selectedMember.user_id || m.id === selectedMember.user_id
                                ? { ...m, my_role: !isAdmin ? 'admin' : 'member' }
                                : m
                            )
                          }));
                        }
                      } catch {
                        toast('操作失败', 'error');
                      }
                      setShowMemberMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-colors"
                  >
                    <span className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    </span>
                    {selectedMember.my_role === 'admin' ? '取消管理员' : '设为管理员'}
                  </button>
                )}
                {(myRole === 'owner' || (myRole === 'admin' && selectedMember.my_role !== 'admin')) && selectedMember.my_role !== 'owner' && (
                  <>
                    <button
                      onClick={() => {
                        setShowMemberMenu(false);
                        setShowMuteModal(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl transition-colors"
                    >
                      <span className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                      </span>
                      {selectedMember.is_muted ? '解除禁言' : '禁言'}
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const res = await groupApi.removeMember(conversationId, selectedMember.user_id);
                          if (res.code === 200) {
                            toast('已移除', 'success');
                            setGroupInfo((prev: any) => ({
                              ...prev,
                              members: prev.members.filter((m: any) =>
                                m.user_id !== selectedMember.user_id && m.id !== selectedMember.user_id
                              )
                            }));
                          }
                        } catch {
                          toast('移除失败', 'error');
                        }
                        setShowMemberMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                    >
                      <span className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9.89 19.38l1.324-8.278a1 1 0 00-.304-1.132 1 1 0 00-1.132-.304l-8.278 1.324A1 1 0 001 10.89l8.278-1.324a1 1 0 00.304-1.132 1 1 0 00-.304-1.132L.304 6.954a1 1 0 00-.304 1.132 1 1 0 001.132.304L9.89 8.39" /></svg>
                      </span>
                      移除成员
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowMemberMenu(false)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 mt-2 text-sm text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors"
                >
                  取消
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mute Modal */}
      <AnimatePresence>
        {showMuteModal && selectedMember && (
          <div className="absolute inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowMuteModal(false)}
            />
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative bg-white dark:bg-[#1A1D21] rounded-2xl p-6 w-80"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-black dark:text-white mb-4">禁言 {selectedMember?.nickname || selectedMember?.username}</h3>
              <div className="space-y-3">
                <button
                  onClick={async () => {
                    try {
                      const res = await groupApi.muteMember(conversationId, selectedMember.user_id, 0);
                      if (res.code === 200) {
                        toast('已解除禁言', 'success');
                        setGroupInfo((prev: any) => ({
                          ...prev,
                          members: prev.members.map((m: any) =>
                            m.user_id === selectedMember.user_id || m.id === selectedMember.user_id
                              ? { ...m, is_muted: 0 }
                              : m
                          )
                        }));
                      }
                    } catch {
                      toast('操作失败', 'error');
                    }
                    setShowMuteModal(false);
                  }}
                  className="w-full py-3 px-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                >
                  解除禁言
                </button>
                <button
                  onClick={async () => {
                    try {
                      const res = await groupApi.muteMember(conversationId, selectedMember.user_id, 10);
                      if (res.code === 200) {
                        toast('已禁言10分钟', 'success');
                        setGroupInfo((prev: any) => ({
                          ...prev,
                          members: prev.members.map((m: any) =>
                            m.user_id === selectedMember.user_id || m.id === selectedMember.user_id
                              ? { ...m, is_muted: 1 }
                              : m
                          )
                        }));
                      }
                    } catch {
                      toast('操作失败', 'error');
                    }
                    setShowMuteModal(false);
                  }}
                  className="w-full py-3 px-4 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
                >
                  禁言10分钟
                </button>
                <button
                  onClick={async () => {
                    try {
                      const res = await groupApi.muteMember(conversationId, selectedMember.user_id, 60);
                      if (res.code === 200) {
                        toast('已禁言1小时', 'success');
                        setGroupInfo((prev: any) => ({
                          ...prev,
                          members: prev.members.map((m: any) =>
                            m.user_id === selectedMember.user_id || m.id === selectedMember.user_id
                              ? { ...m, is_muted: 1 }
                              : m
                          )
                        }));
                      }
                    } catch {
                      toast('操作失败', 'error');
                    }
                    setShowMuteModal(false);
                  }}
                  className="w-full py-3 px-4 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                >
                  禁言1小时
                </button>
                <button
                  onClick={async () => {
                    try {
                      const res = await groupApi.muteMember(conversationId, selectedMember.user_id, 1440);
                      if (res.code === 200) {
                        toast('已禁言24小时', 'success');
                        setGroupInfo((prev: any) => ({
                          ...prev,
                          members: prev.members.map((m: any) =>
                            m.user_id === selectedMember.user_id || m.id === selectedMember.user_id
                              ? { ...m, is_muted: 1 }
                              : m
                          )
                        }));
                      }
                    } catch {
                      toast('操作失败', 'error');
                    }
                    setShowMuteModal(false);
                  }}
                  className="w-full py-3 px-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                >
                  禁言24小时
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center"
            onClick={() => setShowAddMember(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={isMobile ? "w-[90%] max-h-[70vh] bg-white dark:bg-[#1A1D21] rounded-2xl p-4 shadow-xl" : "w-[400px] bg-white dark:bg-[#1A1D21] rounded-2xl p-6 shadow-xl"}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-black dark:text-white">添加群成员</h3>
                <button onClick={() => setShowAddMember(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full">
                  <X size={20} />
                </button>
              </div>
              <div className={isMobile ? "max-h-[50vh] overflow-y-auto" : "max-h-[300px] overflow-y-auto"}>
                {contacts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-black/40 dark:text-white/40 text-sm">
                    <Users size={32} className="mb-2 opacity-50" />
                    <p>暂无联系人</p>
                    <p className="text-xs mt-1">请先添加联系人</p>
                  </div>
                ) : (
                  contacts.map((contact) => {
                    const isAlreadyMember = conversation?.members?.some((m: any) => m.id === contact.id);
                    return (
                      <div
                        key={contact.id}
                        className={clsx(
                          "flex items-center gap-3 py-2 px-2 rounded-xl cursor-pointer transition-colors",
                          isAlreadyMember ? "opacity-50" : "hover:bg-black/5 dark:hover:bg-white/5"
                        )}
                        onClick={() => !isAlreadyMember && handleAddMember(contact.id)}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center text-white font-semibold text-sm">
                          {(contact.nickname || contact.username || 'U')[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-black dark:text-white truncate">{contact.nickname || contact.username || 'Unknown'}</p>
                          <p className="text-xs text-black/40 dark:text-white/40 truncate">@{contact.nickname || '未知'}</p>
                        </div>
                        {isAlreadyMember ? (
                          <span className="text-xs text-black/40 dark:text-white/40">已添加</span>
                        ) : (
                          <button className="p-2 bg-[#007AFF]/10 text-[#007AFF] rounded-full">
                            <Plus size={16} />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-8 flex flex-col gap-6 relative z-10">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : safeMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-black/40 dark:text-white/40 text-sm">
            <p>暂无消息</p>
            <p className="text-xs mt-1">开始聊天吧</p>
          </div>
        ) : (
          safeMessages.map((msg) => {
            if (!msg) return null;
            const isMe = msg.sender_id === user?.id;
            const isRecalled = msg.type === 'recalled';
            return (
              <motion.div
                key={msg.id || Math.random()}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => {
                  if (isMe && !isRecalled) {
                    setSelectedMessage(msg);
                    setShowMessageMenu(true);
                  }
                }}
                onContextMenu={(e) => {
                  if (isMe && !isRecalled) {
                    e.preventDefault();
                    setSelectedMessage(msg);
                    setShowMessageMenu(true);
                  }
                }}
                className={clsx("flex max-w-[70%]", isMe ? "self-end justify-end" : "self-start justify-start gap-3")}
              >
                {!isMe && (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center text-white font-semibold text-sm mt-auto mb-5">
                    {(msg.sender_nickname || msg.nickname || msg.username || 'U')[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <div className={clsx("flex flex-col", isMe ? "items-end" : "items-start")}>
                  {!isMe && (
                    <div className="flex items-center gap-2 mb-1.5 px-1">
                      <span className="text-[13px] font-semibold text-black/60 dark:text-white/60">
                        {msg.sender_nickname || msg.nickname || msg.username || 'Unknown'}
                      </span>
                    </div>
                  )}
                  <div className={clsx("px-4 py-3 rounded-[20px] text-[15px] leading-[1.5]", isRecalled ? "bg-gray-200 dark:bg-gray-800" : isMe ? "bg-gradient-to-tr from-[#007AFF] to-[#5AC8FA] text-white" : "bg-white/90 dark:bg-[#23272D]/90 text-black dark:text-white")}>
                    {msg.type === 'recalled' ? (
                      <p className="text-sm italic opacity-60">{msg.content}</p>
                    ) : msg.type === 'image' ? (
                      <img
                        src={msg.content}
                        alt="图片"
                        className="rounded-lg max-w-[250px] cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewerImage(msg.content);
                          setShowImageViewer(true);
                        }}
                      />
                    ) : (
                      <p className="text-sm">{msg.content}</p>
                    )}
                  </div>
                  <span className="text-[12px] text-black/30 dark:text-white/30 mt-1.5 px-1 font-medium">
                    {formatTime(msg.created_at)}
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Image Viewer */}
      <AnimatePresence>
        {showImageViewer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center cursor-zoom-out"
            onClick={() => setShowImageViewer(false)}
          >
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={viewerImage}
              alt="Preview"
              className="max-w-[90vw] max-h-[90vh] object-contain"
            />
            <button
              onClick={() => setShowImageViewer(false)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"
            >
              <X size={24} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Menu */}
      <AnimatePresence>
        {showMessageMenu && selectedMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={() => setShowMessageMenu(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={isMobile ? "w-[80%] bg-white dark:bg-[#1A1D21] rounded-t-2xl p-4" : "bg-white dark:bg-[#1A1D21] rounded-2xl p-4 w-64 shadow-2xl"}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={async () => {
                  try {
                    const res = await messageApi.recallMessage(selectedMessage.id);
                    if (res.code === 200) {
                      setMessages(prev => prev.map(m =>
                        m.id === selectedMessage.id
                          ? { ...m, type: 'recalled', content: '此消息已撤回' }
                          : m
                      ));
                      fetchConversations();
                      toast('已撤回', 'success');
                    } else {
                      toast(res.msg || '撤回失败', 'error');
                    }
                  } catch {
                    toast('撤回失败', 'error');
                  }
                  setShowMessageMenu(false);
                }}
                className="w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              >
                撤回消息
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedMessage.content);
                  toast('已复制', 'success');
                  setShowMessageMenu(false);
                }}
                className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg mt-1"
              >
                复制
              </button>
              <button
                onClick={() => setShowMessageMenu(false)}
                className="w-full px-4 py-3 text-left text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg mt-1"
              >
                取消
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview */}
      <AnimatePresence>
        {previewImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 py-2 bg-gray-100 dark:bg-[#1A1D21]">
            <div className="relative inline-block">
              <img src={previewImage} alt="Preview" className="h-20 rounded-lg" />
              <button onClick={() => setPreviewImage(null)} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full">
                <X size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className={isMobile ? "px-3 py-2.5 border-t border-gray-200/50 dark:border-white/10 bg-white/90 dark:bg-[#1A1D21]/90 backdrop-blur-xl" : "pb-8 pt-4 px-8 bg-white/70 dark:bg-[#13161A]/70 backdrop-blur-3xl border-t border-black/5 dark:border-white/5 flex justify-center z-40 relative"}>
        <div className={isMobile ? "w-full flex items-end gap-2" : "max-w-4xl w-full flex items-end gap-3"}>
          <div className="relative z-10">
            <button
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              className={isMobile ? "p-2.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors flex-shrink-0" : "p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors flex-shrink-0"}
            >
              <Plus size={isMobile ? 22 : 24} className={showAttachMenu ? "rotate-45 text-[#007AFF]" : "text-gray-600 dark:text-gray-300"} />
            </button>
            {showAttachMenu && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="absolute bottom-full left-0 mb-2 bg-white dark:bg-[#1A1D21] rounded-xl shadow-lg border border-gray-200/50 dark:border-white/10 p-2 min-w-[140px] z-50">
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageSelect} className="hidden" id="image-upload-group" />
                <label htmlFor="image-upload-group" className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg cursor-pointer text-sm active:bg-gray-200 dark:active:bg-white/20 w-full text-gray-700 dark:text-gray-200">
                  <Image size={18} />
                  <span>发送图片</span>
                </label>
              </motion.div>
            )}
          </div>
          <div className={isMobile ? "flex-1 bg-black/5 dark:bg-white/5 rounded-2xl min-h-[44px] max-h-[120px] flex items-center px-4" : "flex-1 bg-black/5 dark:bg-white/5 rounded-[24px] min-h-[46px] max-h-[140px] flex items-center px-4"}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="输入群消息..."
              className={isMobile ? "flex-1 bg-transparent border-none outline-none py-2.5 text-[15px] text-black dark:text-white placeholder:text-black/40" : "flex-1 bg-transparent border-none outline-none py-3 text-[15px] text-black dark:text-white placeholder:text-black/40"}
            />
            {!isMobile && (
              <button className="p-2 text-black/40 hover:text-[#007AFF] transition-colors ml-1">
                <Smile size={20} />
              </button>
            )}
          </div>
          {input.trim() ? (
            <button onClick={handleSend} className={isMobile ? "w-11 h-11 bg-[#007AFF] hover:bg-[#006ce0] rounded-full flex items-center justify-center text-white shadow-md transition-all flex-shrink-0" : "w-[46px] h-[46px] bg-[#007AFF] hover:bg-[#006ce0] rounded-full flex items-center justify-center text-white shadow-md transition-all flex-shrink-0"}>
              <Send size={isMobile ? 18 : 18} />
            </button>
          ) : (
            <button className={isMobile ? "p-2.5 text-black/40 dark:text-white/40 hover:text-[#007AFF] rounded-full transition-colors flex-shrink-0" : "p-3 text-black/40 hover:text-[#007AFF] rounded-full transition-colors flex-shrink-0"}>
              <Mic size={isMobile ? 22 : 24} />
            </button>
          )}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
