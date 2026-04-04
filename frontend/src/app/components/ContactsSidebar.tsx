import { Search, UserPlus, Check, X } from "lucide-react";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useContactStore } from '../../store/contactStore';
import { useAuthStore } from '../../store/authStore';
import { userApi } from '../../api/user';
import { conversationApi } from '../../api/conversation';

export function ContactsSidebar() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const { user } = useAuthStore();
  const { contacts, pendingRequests, fetchContacts, fetchPendingRequests, addContact, acceptContact, rejectContact } = useContactStore();

  useEffect(() => {
    fetchContacts();
    fetchPendingRequests();
    const interval = setInterval(() => {
      fetchContacts();
      fetchPendingRequests();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchContacts, fetchPendingRequests]);

  const handleSearch = async (keyword: string) => {
    setSearch(keyword);
    if (keyword.trim().length < 1) {
      setSearchResults([]);
      setShowSearch(false);
      return;
    }
    setIsSearching(true);
    try {
      const response = await userApi.searchUsers(keyword);
      setSearchResults(response.data || []);
      setShowSearch(true);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddContact = async (userId: number) => {
    try {
      await addContact(userId);
      setSearchResults(prev => prev.filter(u => u.id !== userId));
      alert('Contact request sent!');
    } catch (error: any) {
      alert(error.message || 'Failed to add contact');
    }
  };

  const handleStartChat = async (contactUserId: number) => {
    try {
      const response = await conversationApi.createSingle(contactUserId);
      const conversationId = response.data.id;
      navigate(`/chat/${conversationId}`);
    } catch (error) {
      console.error('Failed to start chat:', error);
    }
  };

  const handleAcceptContact = async (userId: number) => {
    try {
      await acceptContact(userId);
      fetchContacts();
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
          <h1 className="text-xl font-semibold text-black dark:text-white tracking-tight">Contacts</h1>
          <button className="text-[#007AFF] hover:bg-[#007AFF]/10 p-2 rounded-full transition-colors">
            <UserPlus size={18} strokeWidth={2} />
          </button>
        </div>

        <div className="relative group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search size={16} className="text-black/30 dark:text-white/30 group-focus-within:text-[#007AFF] transition-colors" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search Contacts"
            className="w-full h-[38px] pl-9 pr-4 bg-black/5 dark:bg-white/5 rounded-xl outline-none text-[15px] text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:bg-white dark:focus:bg-[#1A1D21] focus:shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:focus:shadow-[0_4px_16px_rgba(0,0,0,0.2)] focus:border-[#007AFF]/30 border border-transparent transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-6 scrollbar-hide">
        {pendingRequests.length > 0 && (
          <div className="mb-2">
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-[#13161A]/80 backdrop-blur-md px-5 py-1.5 border-b border-black/[0.04] dark:border-white/[0.04] flex items-center gap-4">
              <span className="text-[12px] font-bold text-[#007AFF]">Friend Requests ({pendingRequests.length})</span>
            </div>
            <div className="px-2 pt-1">
              {pendingRequests.map((contact) => (
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
                      <div className="w-[42px] h-[42px] rounded-full bg-[#007AFF] flex items-center justify-center text-white font-semibold">
                        {(contact.nickname || contact.username || 'U')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <h3 className="text-[15px] font-medium text-black dark:text-white truncate">
                      {contact.nickname || contact.username}
                    </h3>
                    <p className="text-[12px] text-black/40 dark:text-white/40 truncate">
                      @{contact.username}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAcceptContact(contact.id)}
                      className="p-2 bg-[#34C759] hover:bg-[#2db84d] text-white rounded-full transition-colors"
                    >
                      <Check size={14} strokeWidth={2.5} />
                    </button>
                    <button
                      onClick={() => handleRejectContact(contact.id)}
                      className="p-2 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 text-black dark:text-white rounded-full transition-colors"
                    >
                      <X size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {showSearch && (
          <div className="mb-2">
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-[#13161A]/80 backdrop-blur-md px-5 py-1.5 border-b border-black/[0.04] dark:border-white/[0.04] flex items-center gap-4">
              <span className="text-[12px] font-bold text-black/40 dark:text-white/40">Search Results</span>
            </div>
            <div className="px-2 pt-1">
              {isSearching && (
                <div className="flex items-center justify-center h-20">
                  <div className="w-5 h-5 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {!isSearching && searchResults.length === 0 && (
                <div className="text-center text-black/40 dark:text-white/40 text-sm py-4">No users found</div>
              )}
              {!isSearching && searchResults.map((result) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 py-2 px-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-[14px] cursor-pointer transition-colors group"
                >
                  <div className="relative">
                    {result.avatar ? (
                      <img src={result.avatar} alt={result.nickname} className="w-[42px] h-[42px] rounded-full object-cover shadow-sm" />
                    ) : (
                      <div className="w-[42px] h-[42px] rounded-full bg-[#007AFF] flex items-center justify-center text-white font-semibold">
                        {(result.nickname || result.username || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    {result.status === 1 && (
                      <div className="absolute bottom-0 right-0 w-[12px] h-[12px] bg-[#34C759] border-2 border-white dark:border-[#13161A] rounded-full" />
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
                      className="px-3 py-1.5 text-[12px] font-medium bg-[#007AFF] hover:bg-[#006CE0] text-white rounded-full transition-colors"
                    >
                      Chat
                    </button>
                    <button
                      onClick={() => handleAddContact(result.id)}
                      className="p-1.5 text-[#007AFF] hover:bg-[#007AFF]/10 rounded-full transition-colors"
                    >
                      <UserPlus size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {!showSearch && groupedContacts.map(([letter, contactsGroup]) => (
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
                      <div className="w-[42px] h-[42px] rounded-full bg-[#007AFF] flex items-center justify-center text-white font-semibold transition-transform group-hover:scale-105">
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
                    <p className={`text-[12px] truncate ${contact.status === 1 ? 'text-[#007AFF]' : 'text-black/40 dark:text-white/40'}`}>
                      {contact.status === 1 ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}

        {!showSearch && contacts.length === 0 && pendingRequests.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-black/40 dark:text-white/40 text-sm">
            <p>No contacts yet</p>
            <p className="text-xs mt-1">Search for users to add</p>
          </div>
        )}
      </div>
    </div>
  );
}
