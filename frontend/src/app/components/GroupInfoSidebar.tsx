import { useState, useEffect } from 'react';
import { X, Users, Shield, Crown, Trash2, Settings, ChevronDown, UserMinus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { groupApi } from '../../api/group';
import { useToast } from '../../hooks/useToast';

interface GroupInfoSidebarProps {
  groupId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function GroupInfoSidebar({ groupId, isOpen, onClose }: GroupInfoSidebarProps) {
  const { user } = useAuthStore();
  const { toast, ToastContainer } = useToast();
  const [groupInfo, setGroupInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedMembers, setExpandedMembers] = useState(true);

  useEffect(() => {
    if (isOpen && groupId) {
      loadGroupInfo();
    }
  }, [isOpen, groupId]);

  const loadGroupInfo = async () => {
    setIsLoading(true);
    try {
      const res = await groupApi.getInfo(groupId);
      if (res.code === 200) {
        setGroupInfo(res.data);
      }
    } catch (error) {
      console.error('Failed to load group info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetAdmin = async (memberId: number, currentRole: string) => {
    try {
      const isAdmin = currentRole !== 'admin';
      const res = await groupApi.setAdmin(groupId, memberId, isAdmin);
      if (res.code === 200) {
        toast(res.msg, 'success');
        loadGroupInfo();
      }
    } catch (error) {
      toast('操作失败', 'error');
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!confirm('确定要移除该成员吗？')) return;
    try {
      const res = await groupApi.removeMember(groupId, memberId);
      if (res.code === 200) {
        toast('已移除', 'success');
        loadGroupInfo();
      }
    } catch (error) {
      toast('移除失败', 'error');
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm('确定要退出群聊吗？')) return;
    try {
      const res = await groupApi.leave(groupId);
      if (res.code === 200) {
        toast('已退出群聊', 'success');
        onClose();
        window.location.reload();
      }
    } catch (error) {
      toast('退出失败', 'error');
    }
  };

  if (!isOpen) return null;

  const myRole = groupInfo?.role;
  const isOwner = myRole === 'owner';
  const isAdmin = myRole === 'admin';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="w-80 h-full bg-white dark:bg-[#1A1D21] border-l border-black/5 dark:border-white/10 flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-black/5 dark:border-white/10">
          <h2 className="font-semibold text-black dark:text-white">群信息</h2>
          <button onClick={onClose} className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg">
            <X size={18} className="text-black/60 dark:text-white/60" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : groupInfo ? (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 text-center border-b border-black/5 dark:border-white/10">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center mb-3">
                <Users size={40} className="text-white" />
              </div>
              <h3 className="font-semibold text-lg text-black dark:text-white">{groupInfo.name}</h3>
              {groupInfo.description && (
                <p className="text-sm text-black/60 dark:text-white/60 mt-1">{groupInfo.description}</p>
              )}
              <p className="text-xs text-black/40 dark:text-white/40 mt-2">{groupInfo.member_count || 0} 位成员</p>
            </div>

            <div className="p-4">
              <button
                onClick={() => setExpandedMembers(!expandedMembers)}
                className="w-full flex items-center justify-between text-sm font-medium text-black dark:text-white mb-2"
              >
                <span>群成员</span>
                <ChevronDown size={16} className={`transition-transform ${expandedMembers ? 'rotate-180' : ''}`} />
              </button>

              {expandedMembers && (
                <div className="space-y-1">
                  {groupInfo.members?.map((member: any) => (
                    <div
                      key={member.user_id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 group/member"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center text-white text-sm font-medium">
                        {member.nickname?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-black dark:text-white truncate">
                            {member.nickname || member.username}
                          </span>
                          {member.role === 'owner' && (
                            <span className="px-1 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] rounded flex items-center gap-0.5">
                              <Crown size={8} />群主
                            </span>
                          )}
                          {member.role === 'admin' && (
                            <span className="px-1 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[10px] rounded flex items-center gap-0.5">
                              <Shield size={8} />管理
                            </span>
                          )}
                        </div>
                      </div>

                      {member.user_id !== user?.id && (isOwner || isAdmin) && (
                        <div className="opacity-0 group-hover/member:opacity-100 transition-opacity flex items-center gap-1">
                          {isOwner && (
                            <button
                              onClick={() => handleSetAdmin(member.user_id, member.role)}
                              className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg text-black/60 dark:text-white/60"
                              title={member.role === 'admin' ? '取消管理员' : '设为管理员'}
                            >
                              <Shield size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveMember(member.user_id)}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-black/60 dark:text-white/60 hover:text-red-500"
                            title="移除成员"
                          >
                            <UserMinus size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-black/5 dark:border-white/10">
              {(isOwner || isAdmin || member) && (
                <button
                  onClick={handleLeaveGroup}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  <Trash2 size={16} />
                  <span className="text-sm font-medium">退出群聊</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-black/40 dark:text-white/40">
            加载失败
          </div>
        )}

        <ToastContainer />
      </motion.div>
    </AnimatePresence>
  );
}