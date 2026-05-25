import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { Target } from 'lucide-react';
import { gameApi } from '../../../api/game';
import { generateOpponent, getDynamicDifficulty, getThinkingPhases, recordGameResult as recordDifficultyResult } from './dynamicDifficulty';
import type { Opponent } from './dynamicDifficulty';
import { useGameHeartbeat } from '../../hooks/useGameHeartbeat';

interface TicTacToeBoardProps {
  matchId?: number;
  onGameOver?: (result: 'win' | 'loss' | 'draw') => void;
  mode?: 'ai';
}

type Player = 'X' | 'O' | null;
type Board = (string | null)[];
type GameStatus = 'playing' | 'won' | 'lost' | 'draw';
interface HistoryEntry { board: Board; isXNext: boolean; lastMove: number | null }

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

const THINKING_TIME: Record<string, number> = { easy: 800, medium: 600, hard: 400 };
const OPPONENT_THINKING_LABELS = {
  analyzing: '分析棋局',
  evaluating: '评估策略',
  deciding: '决策落子',
  ready: '即将落子'
};
const DIFFICULTY_DESC: Record<string, string> = {
  easy: '休闲模式：节奏轻松，适合新手热身',
  medium: '竞技模式：策略博弈，适合进阶挑战',
  hard: '大师模式：极限对决，考验真实力'
};

const OPENING_BOOK: Record<number, number[]> = {
  0: [4, 2, 6, 8],
  2: [4, 0, 6, 8],
  6: [4, 0, 2, 8],
  8: [4, 0, 2, 6],
  1: [4, 0, 2, 6],
  3: [4, 0, 2, 8],
  5: [4, 0, 2, 6],
  7: [4, 0, 2, 8],
  4: [0, 2, 6, 8]
};

const SYMMETRY_MAP: Record<number, number> = {
  0: 0, 1: 2, 2: 8, 3: 6, 4: 4, 5: 8, 6: 2, 7: 0, 8: 6
};

function checkWinner(board: Board): { winner: 'X' | 'O' | null; line: number[] | null } {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as 'X' | 'O', line };
    }
  }
  return { winner: null, line: null };
}

function getEmptyIndices(board: Board): number[] {
  return board.reduce<number[]>((acc, cell, idx) => {
    if (cell === null) acc.push(idx);
    return acc;
  }, []);
}

function minimax(
  board: Board,
  depth: number,
  isMaximizing: boolean,
  alpha: number,
  beta: number
): number {
  const result = checkWinner(board);
  if (result.winner === 'X') return depth - 10;
  if (result.winner === 'O') return 10 - depth;

  const empty = getEmptyIndices(board);
  if (empty.length === 0) return 0;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const idx of empty) {
      board[idx] = 'O';
      const eval_ = minimax(board, depth + 1, false, alpha, beta);
      board[idx] = null;
      maxEval = Math.max(maxEval, eval_);
      alpha = Math.max(alpha, eval_);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const idx of empty) {
      board[idx] = 'X';
      const eval_ = minimax(board, depth + 1, true, alpha, beta);
      board[idx] = null;
      minEval = Math.min(minEval, eval_);
      beta = Math.min(beta, eval_);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

function getAIMove(
  board: Board,
  difficulty: 'easy' | 'medium' | 'hard'
): number {
  const empty = getEmptyIndices(board);
  const moveCount = 9 - empty.length;

  const openingResponse = () => {
    if (moveCount === 1) {
      const firstMove = board.findIndex(c => c === 'X');
      if (firstMove !== -1 && OPENING_BOOK[firstMove]) {
        const candidates = OPENING_BOOK[firstMove].filter(c => board[c] === null);
        if (candidates.length > 0) return candidates[0];
      }
    }
    if (moveCount === 3 && board[4] === null) return 4;
    return null;
  };

  const openMove = openingResponse();
  if (openMove !== null) return openMove;

  if (difficulty === 'easy') {
    if (Math.random() < 0.3) {
      return empty[Math.floor(Math.random() * empty.length)];
    }
    let bestScore = -Infinity;
    let bestMoves: number[] = [];
    for (const idx of empty) {
      board[idx] = 'O';
      const score = minimax(board, 1, false, -Infinity, Infinity);
      board[idx] = null;
      if (score > bestScore) {
        bestScore = score;
        bestMoves = [idx];
      } else if (score === bestScore) {
        bestMoves.push(idx);
      }
    }
    if (bestMoves.length > 1 && Math.random() < 0.4) {
      return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }
    return bestMoves[0];
  }

  if (difficulty === 'medium') {
    const scoredMoves: { move: number; score: number }[] = [];
    for (const idx of empty) {
      board[idx] = 'O';
      const score = minimax(board, 0, false, -Infinity, Infinity);
      board[idx] = null;
      scoredMoves.push({ move: idx, score });
    }
    scoredMoves.sort((a, b) => b.score - a.score);
    const topN = scoredMoves.slice(0, Math.min(3, scoredMoves.length));
    return topN[Math.floor(Math.random() * topN.length)].move;
  }

  let bestScore = -Infinity;
  let bestMove = empty[0];
  const centerBias: Record<number, number> = { 4: 2, 0: 1, 2: 1, 6: 1, 8: 1 };
  for (const idx of empty) {
    board[idx] = 'O';
    const score = minimax(board, 0, false, -Infinity, Infinity) + (centerBias[idx] || 0);
    board[idx] = null;
    if (score > bestScore) {
      bestScore = score;
      bestMove = idx;
    }
  }
  return bestMove;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function getStatsFromStorage(): { wins: number; losses: number; draws: number } {
  try {
    const raw = localStorage.getItem('tictactoe_stats');
    if (raw) return JSON.parse(raw);
  } catch {}
  return { wins: 0, losses: 0, draws: 0 };
}

function saveStatsToStorage(stats: { wins: number; losses: number; draws: number }) {
  try {
    localStorage.setItem('tictactoe_stats', JSON.stringify(stats));
  } catch {}
}

export function TicTacToeBoard({
  matchId: _matchId,
  onGameOver,
  mode = 'ai'
}: TicTacToeBoardProps) {
  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [thinkingPhase, setThinkingPhase] = useState<string>('');
  const dynamicDiff = getDynamicDifficulty();
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState<boolean>(true);
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [moveCount, setMoveCount] = useState(0);
  const [lastMoveIndex, setLastMoveIndex] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showDifficultyTip, setShowDifficultyTip] = useState(false);
  const [showReplay, setShowReplay] = useState(false);
  const [flashCell, setFlashCell] = useState<number | null>(null);
  const [boardShake, setBoardShake] = useState(false);
  const [boardGlow, setBoardGlow] = useState(false);
  const [stats, setStats] = useState(() => getStatsFromStorage());
  const [matchId, setMatchId] = useState<number | null>(null);
  const [scoreChange, setScoreChange] = useState<string>('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const initializingRef = useRef(false);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (gameStatus === 'playing') setElapsedTime(t => t + 1);
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameStatus]);

  useEffect(() => {
    generateOpponent().then(setOpponent);
  }, []);

  useGameHeartbeat(matchId, gameStatus === 'playing');

  const initMatch = useCallback(async () => {
    if (initializingRef.current) return;
    initializingRef.current = true;
    try {
      const res = await gameApi.createMatch({
        gameType: 'tictactoe',
        mode: 'ai'
      });
      if (res.code === 200 && res.data?.id) {
        setMatchId(res.data.id);
      }
    } catch {
      console.log('创建对局失败，离线模式运行');
    } finally {
      initializingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (gameStatus === 'playing' && !matchId && !isAIThinking) {
      initMatch();
    }
  }, [gameStatus, matchId, isAIThinking, initMatch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showReplay || gameStatus !== 'playing') {
        if (e.key === 'Escape' && gameStatus !== 'playing') return;
        if (e.key === 'r' || e.key === 'R') { resetBoard(); return; }
        if (e.key === 'Escape') { surrender(); return; }
        return;
      }
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) handleClick(num - 1);
      else if (e.key === 'r' || e.key === 'R') resetBoard();
      else if (e.key === 'u' || e.key === 'U') handleUndo();
      else if (e.key === 'Escape') surrender();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleClick = useCallback((index: number) => {
    if (
      board[index] !== null ||
      gameStatus !== 'playing' ||
      !isXNext ||
      isAIThinking
    ) return;

    setHistory(h => [...h, { board: [...board], isXNext, lastMove: lastMoveIndex }].slice(-20));

    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);
    setIsXNext(false);
    setLastMoveIndex(index);
    setMoveCount(c => c + 1);
    setFlashCell(index);
    setTimeout(() => setFlashCell(null), 300);

    if (matchId) {
      gameApi.move(matchId, { position: [Math.floor(index / 3), index % 3], symbol: 'X' }).catch(() => {});
    }

    const result = checkWinner(newBoard);
    if (result.winner === 'X') {
      setWinningLine(result.line);
      setGameStatus('won');
      setBoardGlow(true);
      setTimeout(() => setBoardGlow(false), 1500);
      const newStats = { ...stats, wins: stats.wins + 1 };
      setStats(newStats);
      saveStatsToStorage(newStats);
      setScoreChange('+10');
      
      if (matchId) {
        try {
          // 玩家获胜
          gameApi.finish(matchId, { won: true }).catch(() => {});
        } catch {}
      }
      
      onGameOver?.('win');
      recordDifficultyResult(true);
      return;
    }

    if (getEmptyIndices(newBoard).length === 0) {
      setGameStatus('draw');
      const newStats = { ...stats, draws: stats.draws + 1 };
      setStats(newStats);
      saveStatsToStorage(newStats);
      setScoreChange('+0');
      
      if (matchId) {
        try {
          // 平局
          gameApi.finish(matchId, { won: false }).catch(() => {});
        } catch {}
      }
      
      onGameOver?.('draw');
      recordDifficultyResult(false);
      return;
    }

    setIsAIThinking(true);
  }, [board, gameStatus, isXNext, isAIThinking, lastMoveIndex, stats, onGameOver, matchId]);

  useEffect(() => {
    if (!isAIThinking || gameStatus !== 'playing') return;
    const phases = getThinkingPhases(THINKING_TIME[dynamicDiff] as number);
    let progress = 0;
    let phaseIndex = 0;
    const phaseLabels: Record<string, string> = {
      analyzing: '分析棋局',
      evaluating: '评估策略',
      deciding: '决策落子',
      ready: '即将落子'
    };
    setThinkingPhase(phaseLabels[phases[0]?.phase] || '思考中');
    const interval = setInterval(() => {
      progress += Math.random() * 20 + 8;
      if (progress > 95) progress = 90 + Math.random() * 6;
      if (phaseIndex < phases.length - 1 && progress >= phases[phaseIndex + 1].progress) {
        phaseIndex++;
        setThinkingPhase(phaseLabels[phases[phaseIndex]?.phase] || '');
      }
    }, THINKING_TIME[dynamicDiff] / 10);
    const timer = setTimeout(() => {
      clearInterval(interval);
      const currentBoard = [...board];
      const aiIdx = getAIMove(currentBoard, dynamicDiff);

      setHistory(h => [...h, { board: currentBoard, isXNext: false, lastMove: lastMoveIndex }].slice(-20));

      const newBoard = [...currentBoard];
      newBoard[aiIdx] = 'O';
      setBoard(newBoard);
      setIsXNext(true);
      setLastMoveIndex(aiIdx);
      setMoveCount(c => c + 1);
      setFlashCell(aiIdx);
      setTimeout(() => setFlashCell(null), 300);
      setIsAIThinking(false);
      setThinkingPhase('');

      if (matchId) {
        gameApi.move(matchId, { position: [Math.floor(aiIdx / 3), aiIdx % 3], symbol: 'O' }).catch(() => {});
      }

      const result = checkWinner(newBoard);
      if (result.winner === 'O') {
        setWinningLine(result.line);
        setGameStatus('lost');
        setBoardShake(true);
        setTimeout(() => setBoardShake(false), 500);
        const newStats = { ...stats, losses: stats.losses + 1 };
        setStats(newStats);
        saveStatsToStorage(newStats);
        setScoreChange('-5');

        if (matchId) {
          try {
            gameApi.finish(matchId, { won: false }).catch(() => {});
          } catch {}
        }

        onGameOver?.('loss');
        recordDifficultyResult(false);
        return;
      }

      if (getEmptyIndices(newBoard).length === 0) {
        setGameStatus('draw');
        const newStats = { ...stats, draws: stats.draws + 1 };
        setStats(newStats);
        saveStatsToStorage(newStats);
        setScoreChange('+0');

        if (matchId) {
          try {
            gameApi.finish(matchId, { won: false }).catch(() => {});
          } catch {}
        }

        onGameOver?.('draw');
        recordDifficultyResult(false);
      }
    }, THINKING_TIME[dynamicDiff]);
    return () => { clearTimeout(timer); clearInterval(interval); setThinkingPhase(''); };
  }, [isAIThinking, gameStatus, board, dynamicDiff, lastMoveIndex, stats, onGameOver, matchId]);

  const handleUndo = useCallback(() => {
    if (history.length < 2 || gameStatus !== 'playing' || isAIThinking) return;
    const prev = history[history.length - 2];
    setBoard(prev.board);
    setIsXNext(prev.isXNext);
    setLastMoveIndex(prev.lastMove);
    setMoveCount(c => Math.max(0, c - 2));
    setHistory(h => h.slice(0, -2));
  }, [history, gameStatus, isAIThinking]);

  const resetBoard = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setGameStatus('playing');
    setWinningLine(null);
    setIsAIThinking(false);
    setMoveCount(0);
    setLastMoveIndex(null);
    setHistory([]);
    setElapsedTime(0);
    setShowReplay(false);
    setFlashCell(null);
    setBoardShake(false);
    setBoardGlow(false);
    setMatchId(null);
    setScoreChange('');
  };

  const surrender = async () => {
    if (gameStatus !== 'playing') return;
    if (!window.confirm('确定要认输吗？这将判为失败。')) return;
    if (matchId) {
      try { await gameApi.surrender(matchId); } catch {}
    }
    setGameStatus('lost');
    setBoardShake(true);
    setTimeout(() => setBoardShake(false), 500);
    const newStats = { ...stats, losses: stats.losses + 1 };
    setStats(newStats);
    saveStatsToStorage(newStats);
    setScoreChange('-5');
    onGameOver?.('loss');
    recordDifficultyResult(false);
  };

  const shareResult = async () => {
    const total = stats.wins + stats.losses + stats.draws;
    const winRate = total > 0 ? ((stats.wins / total) * 100).toFixed(1) : '0.0';
    const diffLabel = dynamicDiff === 'easy' ? '简单' : dynamicDiff === 'medium' ? '中等' : '困难';
    const text = `🎮 井字棋对局报告\n` +
      `难度: ${diffLabel}\n` +
      `结果: ${gameStatus === 'won' ? '✅ 胜利' : gameStatus === 'lost' ? '❌ 失败' : '🤝 平局'}\n` +
      `步数: ${moveCount} | 用时: ${formatTime(elapsedTime)}\n` +
      `历史战绩: ${stats.wins}胜/${stats.losses}负/${stats.draws}平 (胜率${winRate}%)\n` +
      `— IM Chat App 井字棋`;
    try {
      await navigator.clipboard.writeText(text);
      alert('成绩已复制到剪贴板！');
    } catch {
      alert('复制失败，请手动截屏分享');
    }
  };

  const statusText = gameStatus !== 'playing'
    ? ''
    : isAIThinking
    ? `${opponent?.nickname || '对手'} ${thinkingPhase ? thinkingPhase + '...' : '思考中'}`
    : '你的回合';

  const resultConfig = {
    won: { emoji: '🎉', text: '胜利!', score: scoreChange || '+10', color: 'text-green-500' },
    lost: { emoji: '😔', text: '失败', score: scoreChange || '-5', color: 'text-red-500' },
    draw: { emoji: '🤝', text: '平局', score: scoreChange || '+0', color: 'text-yellow-500' }
  };
  const rc = resultConfig[gameStatus];

  const totalGames = stats.wins + stats.losses + stats.draws;
  const winRate = totalGames > 0 ? ((stats.wins / totalGames) * 100).toFixed(1) : '0.0';

  return (
    <div className="max-w-[90vw] sm:max-w-sm mx-auto flex flex-col items-center gap-3 sm:gap-4 relative overflow-hidden">
      {/* Opponent Info Card */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/60 dark:border-gray-700/50 p-4 shadow-sm">
        {opponent ? (
          <>
            <div className="flex items-center gap-3 mb-3">
              <img src={opponent.avatar} alt={opponent.nickname} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{opponent.nickname}</p>
                <p className="text-xs text-gray-500">{opponent.rankLabel} · {opponent.rating}分</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full">实时匹配</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />在线</span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
            </div>
            <p className="text-sm font-medium text-gray-400">匹配对手中...</p>
          </div>
        )}
      </div>

      <div className="w-full bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-2xl p-[1px] shadow-lg">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <span className={clsx(
              "text-xs sm:text-sm font-medium px-3 py-1.5 rounded-full transition-all",
              gameStatus === 'playing' && !isAIThinking
                ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md"
                : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
            )}>
              {statusText}
              {isAIThinking && (
                <>
                  <motion.span className="inline-block w-1.5 h-1.5 ml-1 bg-white rounded-full"
                    animate={{ opacity: [1, 0.3, 1], scale: [1, 0.8, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }} />
                  <motion.span className="inline-block w-1.5 h-1.5 ml-0.5 bg-white rounded-full"
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }} />
                  <motion.span className="inline-block w-1.5 h-1.5 ml-0.5 bg-white rounded-full"
                    animate={{ opacity: [1, 0.3, 1], scale: [1, 0.8, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: 0.6 }} />
                </>
              )}
            </span>

            <div className="flex items-center gap-1.5">
              <div className="relative">
                <button
                  onClick={() => setShowDifficultyTip(v => !v)}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label={`难度说明：${DIFFICULTY_DESC[dynamicDiff]}`}
                >
                  <HelpCircle size={16} className="text-gray-400" />
                </button>
                <AnimatePresence>
                  {showDifficultyTip && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: -5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -5 }}
                      className="absolute right-0 top-full mt-2 w-56 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-3 text-xs text-gray-600 dark:text-gray-300 leading-relaxed"
                    >
                      <p>{DIFFICULTY_DESC[dynamicDiff]}</p>
                      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 flex justify-between">
                        <span className="text-gray-400">思考时间</span>
                        <span className="font-medium">{THINKING_TIME[dynamicDiff]}ms</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <Trophy size={16} className="text-gray-400" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {board.map((cell, index) => {
              const isWinCell = winningLine?.includes(index) ?? false;
              const isLast = lastMoveIndex === index && !isWinCell;
              const isFlashing = flashCell === index;

              return (
                <motion.button
                  key={index}
                  ref={index === 0 ? boardRef : undefined}
                  onClick={() => handleClick(index)}
                  disabled={cell !== null || gameStatus !== 'playing'}
                  initial={cell ? { scale: 0, opacity: 0 } : undefined}
                  animate={{
                    scale: 1,
                    opacity: 1,
                    x: boardShake ? [0, -6, 6, -4, 4, -2, 2, 0] : 0
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                    x: { duration: 0.4 }
                  }}
                  whileHover={cell === null && gameStatus === 'playing' && !isAIThinking ? { scale: 1.05 } : {}}
                  whileTap={cell === null && gameStatus === 'playing' && !isAIThinking ? { scale: 0.95 } : {}}
                  className={clsx(
                    'aspect-square rounded-xl sm:rounded-2xl flex items-center justify-center',
                    'font-bold text-2xl sm:text-3xl cursor-pointer select-none',
                    'transition-all duration-200 backdrop-blur-md',
                    'min-h-[44px] sm:min-h-[60px]',
                    cell === null && gameStatus === 'playing' && !isAIThinking
                      ? 'hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 border border-gray-200/50 dark:border-white/10'
                      : 'cursor-default border border-transparent',
                    isWinCell && 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg shadow-green-500/30 animate-pulse',
                    isLast && !isWinCell && 'ring-2 ring-blue-400 ring-offset-1 ring-offset-white dark:ring-offset-gray-900',
                    isFlashing && 'animate-flash',
                    boardGlow && gameStatus === 'won' && 'shadow-lg shadow-green-400/40'
                  )}
                  aria-label={`格子${index + 1}${cell ? `：${cell}` : '：空'}${isWinCell ? '，胜利连线' : ''}${isLast ? '，最后落子' : ''}`}
                  tabIndex={gameStatus === 'playing' && !isAIThinking ? 0 : -1}
                  role="gridcell"
                >
                  {cell === 'X' && (
                    <motion.span
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="text-[#007AFF] font-black text-3xl sm:text-4xl drop-shadow-[0_2px_8px_rgba(0,122,255,0.4)]"
                      style={{ textShadow: '0 0 12px rgba(0,122,255,0.35)' }}
                    >
                      X
                    </motion.span>
                  )}
                  {cell === 'O' && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center text-white text-sm sm:text-base shadow-md shadow-red-500/30"
                      style={{ boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3), 0 2px 8px rgba(239,68,68,0.3)' }}
                    >
                      O
                    </motion.span>
                  )}
                </motion.button>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
            <div className="flex items-center gap-1.5">
              <Target size={13} />
              <span>{moveCount}步</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={13} />
              <span className="tabular-nums font-mono">{formatTime(elapsedTime)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Trophy size={13} />
              <span>胜率{winRate}%</span>
            </div>
          </div>

          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={handleUndo}
              disabled={history.length < 2 || gameStatus !== 'playing' || isAIThinking}
              className={clsx(
                'flex-1 min-h-[44px] sm:min-h-[48px] py-2 px-3 rounded-xl font-medium text-sm',
                'border-2 transition-all duration-200 flex items-center justify-center gap-1.5',
                history.length >= 2 && gameStatus === 'playing' && !isAIThinking
                  ? 'border-amber-400 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md'
                  : 'border-gray-200 dark:border-gray-700 text-gray-300 cursor-not-allowed dark:border-gray-700'
              )}
              aria-label="撤销上一步（快捷键U）"
              title="撤销 (U)"
            >
              <RotateCcw size={15} />
              撤销({Math.floor(history.length / 2)})
            </button>
            <button
              onClick={surrender}
              disabled={gameStatus !== 'playing'}
              className={clsx(
                'flex-1 min-h-[44px] sm:min-h-[48px] py-2 px-3 rounded-xl font-medium text-sm border-2 transition-all duration-200',
                gameStatus === 'playing'
                  ? 'border-red-400 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md'
                  : 'border-gray-200 dark:border-gray-700 text-gray-300 cursor-not-allowed'
              )}
              aria-label="认输（快捷键ESC）"
              title="认输 (Esc)"
            >
              认输
            </button>
            <button
              onClick={resetBoard}
              className="flex-1 min-h-[44px] sm:min-h-[48px] py-2 px-3 rounded-xl font-medium text-sm bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/25 hover:shadow-xl"
              aria-label="重新开始（快捷键R）"
              title="重开 (R)"
            >
              再来一局
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {gameStatus !== 'playing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) resetBoard(); }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-4 min-w-[280px] sm:min-w-[320px] max-w-[90vw]"
            >
              <motion.p
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1, stiffness: 300 }}
                className="text-6xl"
              >
                {rc.emoji}
              </motion.p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {rc.text}
              </p>
              <p className={clsx('text-lg font-semibold', rc.color)}>
                {rc.score}
              </p>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>⏱ 用时</span><span className="font-mono font-medium text-gray-700 dark:text-gray-300">{formatTime(elapsedTime)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>♟ 步数</span><span className="font-medium text-gray-700 dark:text-gray-300">{moveCount}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>🏆 历史胜率</span><span className="font-medium text-gray-700 dark:text-gray-300">{winRate}% ({stats.wins}/{totalGames})</span>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowReplay(v => !v)}
                  className="flex-1 min-h-[44px] py-2 px-3 rounded-xl text-sm font-medium border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-1.5"
                >
                  <History size={15} />
                  {showReplay ? '收起复盘' : '查看复盘'}
                </button>
                <button
                  onClick={shareResult}
                  className="min-h-[44px] w-11 flex items-center justify-center rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                  aria-label="分享成绩"
                >
                  <Share2 size={16} />
                </button>
              </div>

              <AnimatePresence>
                {showReplay && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="max-h-40 overflow-y-auto bg-gray-50 dark:bg-gray-900 rounded-xl p-3 space-y-1 text-left">
                      <p className="text-xs font-semibold text-gray-400 mb-2">对局步骤</p>
                      {[...Array(moveCount)].map((_, i) => {
                        const entry = history[i];
                        const player = i % 2 === 0 ? 'X' : 'O';
                        const pos = entry?.lastMove ?? (i % 2 === 0
                          ? (history[i]?.board.findIndex((c, j) => c === 'X' && (i === 0 || history[i - 1]?.board[j] !== 'X')) ?? i + 1)
                          : (i > 0 ? history[i]?.board.findIndex((c, j) => c === 'O' && history[i - 1]?.board[j] !== 'O') ?? i + 1 : i + 1));
                        return (
                          <div key={i} className="text-xs flex items-center gap-2 text-gray-600 dark:text-gray-300">
                            <span className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                              {i + 1}
                            </span>
                            <span className={player === 'X' ? 'text-blue-500 font-semibold' : 'text-red-400'}>
                              {player}
                            </span>
                            <span>→ 第{(pos % 3) + 1}行第{Math.floor(pos / 3) + 1}列</span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={resetBoard}
                className="w-full min-h-[48px] py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-600 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/25"
              >
                再来一局
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes flash {
          0%, 100% { background-color: transparent; }
          50% { background-color: rgba(59,130,246,0.15); }
        }
        .animate-flash { animation: flash 0.3s ease-in-out; }
      `}</style>
    </div>
  );
}
