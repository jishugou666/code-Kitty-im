import { useState, useEffect } from 'react';
import { X, Users, Shield, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { groupApi } from '../../api/group';
import { useToast } from '../../hooks/useToast';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (group: any) => void;
}

export function CreateGroupModal({ isOpen, onClose, onSuccess }: CreateGroupModalProps) {
  const { user } = useAuthStore();
  const { toast, ToastContainer } = useToast();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [needApproval, setNeedApproval] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setName('');
      setDescription('');
      setNeedApproval(false);
      setSelectedMembers([]);
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isOpen]);

  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) return;
    setIsSearching(true);
    try {
      const response = await groupApi.search(searchQuery);
      if (response.data.code === 200) {
        setSearchResults(response.data.data || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const toggleMember = (member: any) => {
    if (member.id === user?.id) return;
    setSelectedMembers(prev => {
      const isSelected = prev.some(m => m.id === member.id);
      if (isSelected) {
        return prev.filter(m => m.id !== member.id);
      } else {
        return [...prev, member];
      }
    });
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast('请输入群名称', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const memberIds = selectedMembers.map(m => m.id);
      const response = await groupApi.create({
        name: name.trim(),
        description: description.trim(),
        memberIds,
        needApproval: needApproval ? 1 : 0
      });

      if (response.data.code === 200) {
        toast('创建成功', 'success');
        onSuccess?.(response.data.data);
        onClose();
      } else {
        toast(response.data.msg || '创建失败', 'error');
      }
    } catch (error) {
      toast('创建失败', 'error');
    } finally {
      setIsLoading(false);
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
            <h2 className="text-lg font-semibold text-black dark:text-white">
              {step === 1 ? '创建群组' : '选择成员'}
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg">
              <X size={20} className="text-black/60 dark:text-white/60" />
            </button>
          </div>

          <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {step === 1 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-black/60 dark:text-white/60 mb-1.5">
                    群名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="请输入群名称"
                    className="w-full h-11 px-4 bg-black/5 dark:bg-white/5 rounded-xl outline-none text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black/60 dark:text-white/60 mb-1.5">
                    群介绍
                  </label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="请输入群介绍（可选）"
                    rows={3}
                    className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 rounded-xl outline-none text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30 resize-none"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield size={18} className="text-[#007AFF]" />
                    <span className="text-sm text-black dark:text-white">需要审核</span>
                  </div>
                  <button
                    onClick={() => setNeedApproval(!needApproval)}
                    className={`w-12 h-7 rounded-full transition-colors relative ${
                      needApproval ? 'bg-[#007AFF]' : 'bg-black/20 dark:bg-white/20'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                        needApproval ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="搜索用户添加到群组"
                    className="w-full h-10 pl-10 pr-4 bg-black/5 dark:bg-white/5 rounded-xl outline-none text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30"
                  />
                </div>

                <div className="space-y-2">
                  {searchResults.map(member => (
                    <div
                      key={member.id}
                      onClick={() => toggleMember(member)}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                        selectedMembers.some(m => m.id === member.id)
                          ? 'bg-[#007AFF]/10 border border-[#007AFF]/30'
                          : 'hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center text-white font-medium">
                        {member.nickname?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-black dark:text-white truncate">{member.nickname || member.username}</p>
                        <p className="text-xs text-black/40 dark:text-white/40 truncate">@{member.username}</p>
                      </div>
                      {member.id === user?.id && (
                        <span className="text-xs text-[#007AFF]">群主</span>
                      )}
                    </div>
                  ))}

                  {searchQuery && searchResults.length === 0 && !isSearching && (
                    <div className="text-center py-8 text-black/40 dark:text-white/40">
                      未找到用户
                    </div>
                  )}
                </div>

                {selectedMembers.length > 0 && (
                  <div className="pt-2 border-t border-black/5 dark:border-white/10">
                    <p className="text-sm text-black/60 dark:text-white/60 mb-2">已选择 ({selectedMembers.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedMembers.map(member => (
                        <div
                          key={member.id}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-[#007AFF]/10 rounded-full"
                        >
                          <span className="text-xs text-[#007AFF]">{member.nickname}</span>
                          <button onClick={() => toggleMember(member)} className="text-[#007AFF] hover:text-[#FF3B30]">
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex gap-3 p-4 border-t border-black/5 dark:border-white/10 bg-black/5/30 dark:bg-white/5/30">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="flex-1 h-11 rounded-xl border border-black/10 dark:border-white/10 text-black/60 dark:text-white/60 font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                上一步
              </button>
            )}
            <button
              onClick={step === 1 ? () => setStep(2) : handleCreate}
              disabled={step === 1 && !name.trim() || isLoading}
              className="flex-1 h-11 rounded-xl bg-[#007AFF] text-white font-medium hover:bg-[#006CE0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : step === 1 ? (
                '下一步'
              ) : (
                `创建群组 (${selectedMembers.length + 1}人)`
              )}
            </button>
          </div>

          <ToastContainer />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}