type MessageEventCallback = (message: any) => void;

const listeners: Set<MessageEventCallback> = new Set();

export const messageEventBus = {
  emit(message: any) {
    console.log('[messageEventBus] emit called, listeners count:', listeners.size, 'message:', message?.id, message?.sender_nickname);
    listeners.forEach(cb => {
      try { cb(message); } catch (e) { console.error('[messageEventBus] listener error:', e); }
    });
  },

  subscribe(callback: MessageEventCallback): () => void {
    console.log('[messageEventBus] new subscriber added, total:', listeners.size + 1);
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
      console.log('[messageEventBus] subscriber removed, total:', listeners.size);
    };
  },

  clear() {
    console.log('[messageEventBus] all subscribers cleared');
    listeners.clear();
  }
};
