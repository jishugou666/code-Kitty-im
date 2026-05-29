import { useState, useCallback, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { gameApi } from '../api/game';
import { useGameChannel } from './useGameChannel';
import { getDynamicDifficulty, recordGameResult } from '../app/components/games/dynamicDifficulty';
import type { GameType } from '../app/components/games/dynamicDifficulty';

interface UseGameMatchOptions {
  gameType: GameType;
  mode: 'ai' | 'pvp';
  matchId?: number | null;
  onGameOver?: (result: 'win' | 'loss' | 'draw') => void;
  channelCallbacks?: {
    onRemoteMove?: (data: any) => void;
    onRemoteSurrender?: () => void;
    onRemoteFinished?: (data: any) => void;
  };
}

export interface GameResult {
  result: 'win' | 'loss' | 'draw';
  scoreChange: number;
}

export function useGameMatch(options: UseGameMatchOptions) {
  const { gameType, mode, matchId: _matchId, onGameOver, channelCallbacks } = options;
  const { user } = useAuthStore();

  const [matchId, setMatchId] = useState<number | null>(_matchId || null);
  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'won' | 'lost' | 'draw'>('idle');
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [aiThinkProgress, setAiThinkProgress] = useState(0);
  const [moveCount, setMoveCount] = useState(0);
  const [scoreChange, setScoreChange] = useState<string>('');
  const initializingRef = useRef(false);

  const initMatch = useCallback(async () => {
    if (initializingRef.current) return null;
    initializingRef.current = true;

    try {
      setGameStatus('playing');

      if (_matchId && mode === 'pvp') {
        const data = await gameApi.getMatch(_matchId);
        setMatchId(data.id);
        initializingRef.current = false;
        return data;
      } else {
        const difficultyConfig = getDynamicDifficulty(gameType, 0);
        const data = await gameApi.createMatch({
          gameType,
          mode,
          aiDifficulty: 'medium',
        });
        setMatchId(data.id);
        initializingRef.current = false;
        return data;
      }
    } catch (error) {
      console.error('Failed to initialize match:', error);
      setGameStatus('idle');
      initializingRef.current = false;
      throw error;
    }
  }, [_matchId, mode, gameType]);

  const callbacks = {
    onRemoteMove: channelCallbacks?.onRemoteMove || ((data: any) => {
      console.log('Remote move received:', data);
    }),
    onRemoteSurrender: channelCallbacks?.onRemoteSurrender || (() => {
      if (gameStatus !== 'playing') return;
      setGameStatus('won');
      const score = 10 + Math.floor(Math.random() * 3);
      setScoreChange(`+${score}`);
      recordGameResult(true);
      onGameOver?.('win');
    }),
    onRemoteFinished: channelCallbacks?.onRemoteFinished || ((data: any) => {
      if (gameStatus !== 'playing') return;
      const myId = user?.id;
      const iWon = data.winnerId === myId;

      if (iWon) {
        setGameStatus('won');
        const score = 10 + Math.floor(Math.random() * 3);
        setScoreChange(`+${score}`);
        recordGameResult(true);
        onGameOver?.('win');
      } else if (data.status === 'finished' && data.winnerId) {
        setGameStatus('lost');
        const score = -(5 + Math.floor(Math.random() * 3));
        setScoreChange(score.toString());
        recordGameResult(false);
        onGameOver?.('loss');
      }

      if (data.scoreChange) {
        setScoreChange(data.scoreChange.toString());
      }
    })
  };

  useGameChannel(matchId, callbacks);

  const simulateAIThink = useCallback(async (): Promise<number> => {
    setIsAIThinking(true);
    setAiThinkProgress(0);

    const config = getDynamicDifficulty(gameType, moveCount);
    const thinkTime = config.thinkTime;

    const steps = 20;
    const stepTime = thinkTime / steps;

    for (let i = 1; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, stepTime));
      setAiThinkProgress((i / steps) * 100);
    }

    setIsAIThinking(false);
    setAiThinkProgress(0);

    return thinkTime;
  }, [gameType, moveCount]);

  const surrender = useCallback(async () => {
    if (!matchId) return;

    try {
      await gameApi.surrender(matchId);
      setGameStatus('lost');
      const score = -(5 + Math.floor(Math.random() * 3));
      setScoreChange(score.toString());
      recordGameResult(false);
      onGameOver?.('loss');
    } catch (error) {
      console.error('Surrender failed:', error);
    }
  }, [matchId, onGameOver]);

  const finishMatch = useCallback(async (won: boolean) => {
    if (!matchId) return;

    try {
      await gameApi.finish(matchId, { won });
      setGameStatus(won ? 'won' : 'lost');

      if (won) {
        const score = 10 + Math.floor(Math.random() * 3);
        setScoreChange(`+${score}`);
        recordGameResult(true);
        onGameOver?.('win');
      } else {
        const score = -(5 + Math.floor(Math.random() * 3));
        setScoreChange(score.toString());
        recordGameResult(false);
        onGameOver?.('loss');
      }
    } catch (error) {
      console.error('Finish match failed:', error);
    }
  }, [matchId, onGameOver]);

  const incrementMoveCount = useCallback(() => {
    setMoveCount(prev => prev + 1);
  }, []);

  const resetGameState = useCallback(() => {
    setGameStatus('idle');
    setIsAIThinking(false);
    setAiThinkProgress(0);
    setMoveCount(0);
    setScoreChange('');
  }, []);

  return {
    matchId,
    setMatchId,
    gameStatus,
    setGameStatus,
    isAIThinking,
    aiThinkProgress,
    moveCount,
    setMoveCount,
    scoreChange,
    setScoreChange,
    initMatch,
    simulateAIThink,
    surrender,
    finishMatch,
    incrementMoveCount,
    resetGameState
  };
}
