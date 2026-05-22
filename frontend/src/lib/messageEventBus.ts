type MessageEventCallback = (message: any) => void;

const listeners: Set<MessageEventCallback> = new Set();

export const messageEventBus = {
  emit(message: any) {
    listeners.forEach(cb => {
      try { cb(message); } catch (e) { console.error('messageEventBus listener error:', e); }
    });
  },

  subscribe(callback: MessageEventCallback): () => void {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },

  clear() {
    listeners.clear();
  }
};
