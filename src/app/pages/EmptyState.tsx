import { MessageCircle } from "lucide-react";
import { motion } from "motion/react";

export function EmptyState() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-[#FAFAFC] dark:bg-[#0A0C10] relative overflow-hidden">
      {/* Subtle Background Decor */}
      <div className="absolute top-[20%] right-[20%] w-[400px] h-[400px] bg-blue-400/5 dark:bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[20%] w-[400px] h-[400px] bg-purple-400/5 dark:bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center z-10"
      >
        <div className="w-24 h-24 bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-[28px] flex items-center justify-center mb-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
          <MessageCircle size={40} className="text-[#007AFF] opacity-80" strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-medium text-black/60 dark:text-white/60 tracking-tight">
          Select a chat to start messaging
        </h2>
        <p className="text-[14px] text-black/40 dark:text-white/40 mt-3 max-w-[280px] text-center leading-relaxed">
          Choose from your existing conversations or start a new one from your contacts.
        </p>
      </motion.div>
    </div>
  );
}
