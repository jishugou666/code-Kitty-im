import { useState, useEffect } from 'react';
import { X, Users, Search, Shield, Check, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { groupApi } from '../../api/group';
import { useToast } from '../../hooks/useToast';

interface GroupSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GroupSearchModal({ isOpen, onClose }: GroupSearchModalProps) {
  const { user } = useAuthStore();
  const { toast, ToastContainer } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [groups, setGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [joining, setJoining] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setGroups([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 1) {
        handleSearch();
      } else {
        setGroups([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const response = await groupApi.search(searchQuery);
      if (response.code === 200) {
        setGroups(response.data || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async (groupId: number, needApproval: boolean) => {
    setJoining(groupId);
    try {
      const response = await groupApi.join(groupId);
      if (response.code === 200) {
        toast(response.msg, 'success');
        handleSearch();
      } else {
        toast(response.msg, 'error');
      }
    } catch (error) {
      toast('加入失败', 'error');
    } finally {
      setJoining(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="absolute inset-0 z-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="relative bg-white dark:bg-[#1A1D21] rounded-2xl w-full max-w-lg mx-4 shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-black/5 dark:border-white/10">
            <h2 className="text-lg font-semibold text-black dark:text-white">搜索群组</h2>
            <button onClick={onClose} className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg">
              <X size={20} className="text-black/60 dark:text-white/60" />
            </button>
          </div>

          <div className="p-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="输入群名称搜索"
                className="w-full h-11 pl-10 pr-4 bg-black/5 dark:bg-white/5 rounded-xl outline-none text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30"
                autoFocus
              />
              {isLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-[#007AFF]/30 border-t-[#007AFF] rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto px-4 pb-4 space-y-2">
            {groups.map(group => (
              <div
                key={group.id}
                className="flex items-center gap-3 p-3 bg-black/5 dark:bg-white/5 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center">
                  <Users size={24} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-black dark:text-white truncate">{group.name}</p>
                    {group.owner_id === user?.id && (
                      <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] rounded">群主</span>
                    )}
                  </div>
                  <p className="text-xs text-black/40 dark:text-white/40 truncate">
                    {group.member_count} 位成员 {group.description && `· ${group.description}`}
                  </p>
                </div>
                <div>
                  {group.is_member ? (
                    <span className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded-lg flex items-center gap-1">
                      <Check size={14} /> 已加入
                    </span>
                  ) : group.need_approval === 1 ? (
                    <button
                      onClick={() => handleJoin(group.id, true)}
                      disabled={joining === group.id}
                      className="px-3 py-1.5 bg-[#007AFF] text-white text-xs rounded-lg hover:bg-[#006CE0] disabled:opacity-50 flex items-center gap-1"
                    >
                      {joining === group.id ? (
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Clock size={14} /> 申请加入
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoin(group.id, false)}
                      disabled={joining === group.id}
                      className="px-3 py-1.5 bg-[#007AFF] text-white text-xs rounded-lg hover:bg-[#006CE0] disabled:opacity-50 flex items-center gap-1"
                    >
                      {joining === group.id ? (
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Users size={14} /> 加入
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {searchQuery && groups.length === 0 && !isLoading && (
              <div className="text-center py-8 text-black/40 dark:text-white/40">
                未找到相关群组
              </div>
            )}

            {!searchQuery && (
              <div className="text-center py-8 text-black/40 dark:text-white/40">
                输入群名称搜索
              </div>
            )}
          </div>

          <ToastContainer />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}