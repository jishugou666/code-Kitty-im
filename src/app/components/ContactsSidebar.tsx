import { Search, UserPlus } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

const CONTACTS_DATA = [
  {
    letter: "A",
    contacts: [
      { id: "a1", name: "Alice Smith", avatar: "https://images.unsplash.com/photo-1594318223885-20dc4b889f9e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHdvbWFuJTIwc21pbGV8ZW58MXx8fHwxNzc1MjMyMDcxfDA&ixlib=rb-4.1.0&q=80&w=1080", status: "online" },
      { id: "a2", name: "Andrew Jones", avatar: "https://images.unsplash.com/photo-1609231443127-7e1e4c672ece?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMG1hbiUyMGNvbmZpZGVudHxlbnwxfHx8fDE3NzUyODAxMjB8MA&ixlib=rb-4.1.0&q=80&w=1080", status: "last seen recently" }
    ]
  },
  {
    letter: "D",
    contacts: [
      { id: "d1", name: "David Kim", avatar: "https://images.unsplash.com/photo-1762522921456-cdfe882d36c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHByb2Zlc3Npb25hbCUyMHBvcnRyYWl0fGVufDF8fHx8MTc3NTI1MjQ2OHww&ixlib=rb-4.1.0&q=80&w=1080", status: "online" }
    ]
  },
  {
    letter: "E",
    contacts: [
      { id: "e1", name: "Emma Watson", avatar: "https://images.unsplash.com/photo-1594318223885-20dc4b889f9e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHdvbWFuJTIwc21pbGV8ZW58MXx8fHwxNzc1MjMyMDcxfDA&ixlib=rb-4.1.0&q=80&w=1080", status: "online" }
    ]
  },
  {
    letter: "J",
    contacts: [
      { id: "j1", name: "Jessica Taylor", avatar: "https://images.unsplash.com/photo-1624303966826-260632059640?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMGd1eSUyMGNhc3VhbCUyMHBvcnRyYWl0fGVufDF8fHx8MTc3NTI4MDEyMHww&ixlib=rb-4.1.0&q=80&w=1080", status: "last seen at 10:45 AM" }
    ]
  },
  {
    letter: "M",
    contacts: [
      { id: "m1", name: "Michael Chen", avatar: "https://images.unsplash.com/photo-1609231443127-7e1e4c672ece?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMG1hbiUyMGNvbmZpZGVudHxlbnwxfHx8fDE3NzUyODAxMjB8MA&ixlib=rb-4.1.0&q=80&w=1080", status: "online" }
    ]
  },
  {
    letter: "S",
    contacts: [
      { id: "s1", name: "Sarah Lee", avatar: "https://images.unsplash.com/photo-1643816831186-b2427a8f9f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc2lhbiUyMHdvbWFuJTIwcG9ydHJhaXQlMjBzbWlsaW5nfGVufDF8fHx8MTc3NTI4MDEyMHww&ixlib=rb-4.1.0&q=80&w=1080", status: "last seen yesterday" }
    ]
  }
];

export function ContactsSidebar() {
  const [search, setSearch] = useState("");

  return (
    <div className="flex flex-col h-full bg-transparent relative">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-white/60 dark:bg-[#13161A]/60 backdrop-blur-3xl pt-8 pb-4 px-4 border-b border-black/5 dark:border-white/5 flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <h1 className="text-xl font-semibold text-black dark:text-white tracking-tight">Contacts</h1>
          <button className="text-[#007AFF] hover:bg-[#007AFF]/10 p-2 rounded-full transition-colors">
            <UserPlus size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search size={16} className="text-black/30 dark:text-white/30 group-focus-within:text-[#007AFF] transition-colors" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Contacts"
            className="w-full h-[38px] pl-9 pr-4 bg-black/5 dark:bg-white/5 rounded-xl outline-none text-[15px] text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:bg-white dark:focus:bg-[#1A1D21] focus:shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:focus:shadow-[0_4px_16px_rgba(0,0,0,0.2)] focus:border-[#007AFF]/30 border border-transparent transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto pb-6 scrollbar-hide">
        {CONTACTS_DATA.map((group) => (
          <div key={group.letter} className="mb-2">
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-[#13161A]/80 backdrop-blur-md px-5 py-1.5 border-b border-black/[0.04] dark:border-white/[0.04] flex items-center gap-4">
              <span className="text-[12px] font-bold text-black/40 dark:text-white/40 w-4 text-center">
                {group.letter}
              </span>
            </div>
            <div className="px-2 pt-1">
              {group.contacts.map((contact, index) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 py-2 px-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-[14px] cursor-pointer transition-colors group"
                >
                  <div className="relative">
                    <img src={contact.avatar} alt={contact.name} className="w-[42px] h-[42px] rounded-full object-cover shadow-sm transition-transform group-hover:scale-105" />
                    {contact.status === "online" && (
                      <div className="absolute bottom-0 right-0 w-[12px] h-[12px] bg-[#34C759] border-2 border-white dark:border-[#13161A] rounded-full" />
                    )}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <h3 className="text-[15px] font-medium text-black dark:text-white truncate">
                      {contact.name}
                    </h3>
                    <p className={`text-[12px] truncate ${contact.status === 'online' ? 'text-[#007AFF]' : 'text-black/40 dark:text-white/40'}`}>
                      {contact.status}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
