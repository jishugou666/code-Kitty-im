import { useRef, useEffect, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualMessageListProps {
  messages: any[];
  messageGroups: { [key: string]: any[] };
  isLoading: boolean;
  isLoadingHistory: boolean;
  isMobile: boolean;
  userId?: number | null;
  onShowMenu: (message: any) => void;
  onRespondGameInvite: (matchId: number, accepted: boolean, gameType?: string) => void;
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
  onLoadMore: () => void;
  hasMore: boolean;
  renderMessageItem: (message: any, isOwnMessage: boolean, isRecalled: boolean) => React.ReactNode;
}

export function VirtualMessageList({
  messages,
  messageGroups,
  isLoading,
  isLoadingHistory,
  isMobile,
  userId,
  onShowMenu,
  onRespondGameInvite,
  messagesContainerRef,
  onLoadMore,
  hasMore,
  renderMessageItem
}: VirtualMessageListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const flatMessages = Object.entries(messageGroups).flatMap(([date, msgs]) => [
    { type: 'date-separator', date },
    ...msgs.map((msg) => ({ type: 'message', data: msg }))
  ]);

  const virtualizer = useVirtualizer({
    count: flatMessages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const item = flatMessages[index];
      if (!item) return 80;
      if (item.type === 'date-separator') return 40;
      
      const msg = item.data;
      if (msg.type === 'image') return isMobile ? 180 : 220;
      if (msg.type === 'game_invite') return isMobile ? 160 : 180;
      if (msg.type === 'file') return 60;
      if (msg.type === 'recalled') return 50;
      return isMobile ? 70 : 80;
    },
    overscan: 5,
  });

  const handleScroll = useCallback(() => {
    const container = parentRef.current;
    if (!container) return;

    if (container.scrollTop < 50 && hasMore && !isLoadingHistory) {
      onLoadMore();
    }
  }, [hasMore, isLoadingHistory, onLoadMore]);

  useEffect(() => {
    const container = parentRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className="flex-1 overflow-y-auto px-4 py-4"
      style={{ height: '100%' }}
    >
      {isLoadingHistory && (
        <div className="flex items-center justify-center py-4">
          <div className="w-6 h-6 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-gray-400 dark:text-gray-500">
        </div>
      ) : (
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualItem) => {
            const item = flatMessages[virtualItem.index];
            if (!item) return null;

            if (item.type === 'date-separator') {
              return (
                <div
                  key={`date-${item.date}`}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <div className="flex items-center gap-2 my-4">
                    <div className="flex-1 h-px bg-gray-200/50 dark:bg-white/10" />
                    <span className="text-xs text-gray-400 dark:text-gray-500 px-2">{item.date}</span>
                    <div className="flex-1 h-px bg-gray-200/50 dark:bg-white/10" />
                  </div>
                </div>
              );
            }

            const message = item.data;
            const isOwnMessage = message.sender_id === userId;
            const isRecalled = message.type === 'recalled';

            return (
              <div
                key={message.id || Math.random()}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                {renderMessageItem(message, isOwnMessage, isRecalled)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
