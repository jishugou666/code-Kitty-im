import { Search, X, UserPlus, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { userApi } from '../../api/user';
import { conversationApi } from '../../api/conversation';
import { contactApi } from '../../api/contact';
import { useToast } from '../../hooks/useToast';
import { useTranslation } from 'react-i18next';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSuccess?: () => void;
}

export function SearchModal({ isOpen, onClose, onAddSuccess }: SearchModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast, ToastContainer } = useToast();

  useEffect(() => {
    if (!isOpen) {
      setSearch("");
      setSearchResults([]);
    }
  }, [isOpen]);

  const handleSearch = async (keyword: string) => {
    setSearch(keyword);
    if (keyword.trim().length < 1) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const response = await userApi.searchUsers(keyword);
      setSearchResults(response.data || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddContact = async (userId: number) => {
    try {
      await contactApi.addContact(userId);
      toast(t('contacts.addSuccess'), 'success');
      onAddSuccess?.();
    } catch (error: any) {
      toast(error.message || t('common.error'), 'error');
    }
  };

  const handleStartChat = async (userId: number) => {
    try {
      const response = await conversationApi.createSingle(userId);
      const conversationId = response.data.id;
      navigate(`/chat/${conversationId}`);
      onClose();
    } catch (error) {
      console.error('Failed to start chat:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-[10%] z-50 mx-auto max-w-lg bg-white dark:bg-[#1A1D21] rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-3 p-4 border-b border-black/5 dark:border-white/5">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-black/30 dark:text-white/30" />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder={t('contacts.searchPlaceholder')}
                  autoFocus
                  className="w-full h-10 pl-10 pr-4 bg-black/5 dark:bg-white/5 rounded-xl outline-none text-[15px] text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:ring-2 focus:ring-[#007AFF]/30 transition-all"
                />
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
              >
                <X size={20} className="text-black/60 dark:text-white/60" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-4">
              {isSearching && (
                <div className="flex items-center justify-center h-32">
                  <div className="w-6 h-6 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!isSearching && searchResults.length === 0 && search.trim().length > 0 && (
                <div className="text-center text-black/40 dark:text-white/40 py-8">
                  {t('contacts.noResults')}
                </div>
              )}

              {!isSearching && searchResults.length === 0 && search.trim().length === 0 && (
                <div className="text-center text-black/40 dark:text-white/40 py-8">
                  {t('contacts.searchUsers')}
                </div>
              )}

              {!isSearching && searchResults.map((result) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 py-3 px-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="relative">
                    {result.avatar ? (
                      <img src={result.avatar} alt={result.nickname} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] flex items-center justify-center text-white font-semibold text-lg">
                        {(result.nickname || result.username || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    {result.status === 1 && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#34C759] border-2 border-white dark:border-[#1A1D21] rounded-full" />
                    )}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <h3 className="text-[15px] font-medium text-black dark:text-white truncate">
                      {result.nickname || result.username}
                    </h3>
                    <p className="text-[12px] text-black/40 dark:text-white/40 truncate">
                      @{result.username}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStartChat(result.id)}
                      className="p-2 hover:bg-[#007AFF]/10 text-[#007AFF] rounded-full transition-colors"
                      title={t('chat.message')}
                    >
                      <MessageCircle size={18} />
                    </button>
                    <button
                      onClick={() => handleAddContact(result.id)}
                      className="p-2 hover:bg-[#007AFF]/10 text-[#007AFF] rounded-full transition-colors"
                      title={t('contacts.addContact')}
                    >
                      <UserPlus size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
            <ToastContainer />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}