import { useEffect, useRef, useCallback } from 'react';
import { getPusher } from './useWebSocket';
import { useAuthStore } from '../store/authStore';

export interface GameMoveEvent {
  matchId: number;
  position: number[];
  symbol: string;
  userId: number;
  moveCount: number;
  timestamp: string;
}

export interface GameSurrenderEvent {
  matchId: number;
  userId: number;
  timestamp: string;
}

export interface GameFinishedEvent {
  matchId: number;
  winnerId: number | null;
  status: string;
  scoreChange: number | null;
  timestamp: string;
}

export function useGameChannel(
  matchId: number | null,
  callbacks: {
    onRemoteMove?: (data: GameMoveEvent) => void;
    onRemoteSurrender?: (data: GameSurrenderEvent) => void;
    onRemoteFinished?: (data: GameFinishedEvent) => void;
  } = {}
) {
  const channelRef = useRef<ReturnType<ReturnType<typeof getPusher>['subscribe']> | null>(null);
  const { isAuthenticated, token } = useAuthStore();
  const myUserId = useAuthStore.getState().user?.id;

  const handleMove = useCallback((data: any) => {
    if (data && data.userId !== myUserId) {
      callbacks.onRemoteMove?.(data as GameMoveEvent);
    }
  }, [callbacks.onRemoteMove, myUserId]);

  const handleSurrender = useCallback((data: any) => {
    if (data && data.userId !== myUserId) {
      callbacks.onRemoteSurrender?.(data as GameSurrenderEvent);
    }
  }, [callbacks.onRemoteSurrender, myUserId]);

  const handleFinished = useCallback((data: any) => {
    callbacks.onRemoteFinished?.(data as GameFinishedEvent);
  }, [callbacks.onRemoteFinished]);

  useEffect(() => {
    if (!isAuthenticated || !token || !matchId) return;

    const pusher = getPusher();
    const channelName = `game-${matchId}`;

    channelRef.current = pusher.subscribe(channelName);

    channelRef.current.bind('game-move', handleMove);
    channelRef.current.bind('game-surrender', handleSurrender);
    channelRef.current.bind('game-finished', handleFinished);

    return () => {
      if (channelRef.current) {
        channelRef.current.unbind('game-move', handleMove);
        channelRef.current.unbind('game-surrender', handleSurrender);
        channelRef.current.unbind('game-finished', handleFinished);
        pusher.unsubscribe(channelName);
        channelRef.current = null;
      }
    };
  }, [isAuthenticated, token, matchId, handleMove, handleSurrender, handleFinished]);
}
