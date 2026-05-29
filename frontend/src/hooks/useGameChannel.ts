import { useEffect, useRef } from 'react';
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
  const myUserIdRef = useRef(useAuthStore.getState().user?.id);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    const unsub = useAuthStore.subscribe((state) => {
      if (state.user?.id !== myUserIdRef.current) {
        myUserIdRef.current = state.user?.id ?? null;
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !token || !matchId) return;

    const pusher = getPusher();
    const channelName = `game-${matchId}`;

    channelRef.current = pusher.subscribe(channelName);

    const handleMove = (data: GameMoveEvent) => {
      if (data && data.userId !== myUserIdRef.current) {
        callbacksRef.current.onRemoteMove?.(data);
      }
    };

    const handleSurrender = (data: GameSurrenderEvent) => {
      if (data && data.userId !== myUserIdRef.current) {
        callbacksRef.current.onRemoteSurrender?.(data);
      }
    };

    const handleFinished = (data: GameFinishedEvent) => {
      callbacksRef.current.onRemoteFinished?.(data);
    };

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
  }, [isAuthenticated, token, matchId]);
}
