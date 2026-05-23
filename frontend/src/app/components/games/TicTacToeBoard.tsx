import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { Trophy } from 'lucide-react';

interface TicTacToeBoardProps {
  matchId?: number;
  onGameOver?: (result: 'win' | 'loss' | 'draw') => void;
  aiDifficulty?: 'easy' | 'medium' | 'hard';
  mode?: 'ai';
}

type Player = 'X' | 'O' | null;
type Board = (string | null)[];
type GameStatus = 'playing' | 'won' | 'lost' | 'draw';

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

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
  if (result.winner === 'X') return 10 - depth;
  if (result.winner === 'O') return depth - 10;

  const empty = getEmptyIndices(board);
  if (empty.length === 0) return 0;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const idx of empty) {
      board[idx] = 'X';
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
      board[idx] = 'O';
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

  if (difficulty === 'easy') {
    if (Math.random() < 0.3) {
      return empty[Math.floor(Math.random() * empty.length)];
    }
    let bestScore = -Infinity;
    let bestMove = empty[0];
    for (const idx of empty) {
      board[idx] = 'O';
      const score = minimax(board, 0, false, -Infinity, Infinity);
      board[idx] = null;
      if (score > bestScore) {
        bestScore = score;
        bestMove = idx;
      }
    }
    return bestMove;
  }

  if (difficulty === 'medium') {
    let bestScore = -Infinity;
    let bestMove = empty[0];
    for (const idx of empty) {
      board[idx] = 'O';
      const score = minimax(board, 0, false, -Infinity, Infinity);
      board[idx] = null;
      if (score > bestScore) {
        bestScore = score;
        bestMove = idx;
      }
    }
    return bestMove;
  }

  let bestScore = -Infinity;
  let bestMove = empty[0];
  for (const idx of empty) {
    board[idx] = 'O';
    const score = minimax(board, 0, false, -Infinity, Infinity);
    board[idx] = null;
    if (score > bestScore) {
      bestScore = score;
      bestMove = idx;
    }
  }
  return bestMove;
}

export function TicTacToeBoard({
  matchId: _matchId,
  onGameOver,
  aiDifficulty = 'medium',
  mode = 'ai'
}: TicTacToeBoardProps) {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState<boolean>(true);
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [moveCount, setMoveCount] = useState(0);
  const [lastMoveIndex, setLastMoveIndex] = useState<number | null>(null);

  const handleClick = useCallback((index: number) => {
    if (
      board[index] !== null ||
      gameStatus !== 'playing' ||
      !isXNext ||
      isAIThinking
    ) {
      return;
    }

    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);
    setIsXNext(false);
    setLastMoveIndex(index);
    setMoveCount(c => c + 1);

    const result = checkWinner(newBoard);
    if (result.winner === 'X') {
      setWinningLine(result.line);
      setGameStatus('won');
      onGameOver?.('win');
      return;
    }

    if (getEmptyIndices(newBoard).length === 0) {
      setGameStatus('draw');
      onGameOver?.('draw');
      return;
    }

    setIsAIThinking(true);
  }, [board, gameStatus, isXNext, isAIThinking, onGameOver]);

  const aiMove = useCallback(() => {
    setTimeout(() => {
      const currentBoard = [...board];
      const aiIdx = getAIMove(currentBoard, aiDifficulty);

      const newBoard = [...currentBoard];
      newBoard[aiIdx] = 'O';
      setBoard(newBoard);
      setIsXNext(true);
      setLastMoveIndex(aiIdx);
      setMoveCount(c => c + 1);
      setIsAIThinking(false);

      const result = checkWinner(newBoard);
      if (result.winner === 'O') {
        setWinningLine(result.line);
        setGameStatus('lost');
        onGameOver?.('loss');
        return;
      }

      if (getEmptyIndices(newBoard).length === 0) {
        setGameStatus('draw');
        onGameOver?.('draw');
      }
    }, 500);
  }, [board, aiDifficulty, onGameOver]);

  const resetBoard = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setGameStatus('playing');
    setWinningLine(null);
    setIsAIThinking(false);
    setMoveCount(0);
    setLastMoveIndex(null);
  };

  const surrender = () => {
    if (gameStatus === 'playing') {
      setGameStatus('lost');
      onGameOver?.('loss');
    }
  };

  useEffect(() => {
    if (isAIThinking && gameStatus === 'playing') {
      aiMove();
    }
  }, [isAIThinking, gameStatus, aiMove]);

  const statusText = gameStatus !== 'playing'
    ? ''
    : isAIThinking
    ? 'AI 思考中...'
    : '你的回合';

  const resultConfig = {
    won: { emoji: '🎉', text: '胜利!', score: '+25' },
    lost: { emoji: '😔', text: '失败', score: '-15' },
    draw: { emoji: '🤝', text: '平局', score: '' }
  };

  return (
    <div className="max-w-sm mx-auto p-4 flex flex-col items-center gap-4">
      <div className="w-full flex items-center justify-between">
        <span className={clsx(
          "text-sm font-medium px-3 py-1 rounded-full",
          gameStatus === 'playing' && !isAIThinking
            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
            : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
        )}>
          {statusText}
          {isAIThinking && (
            <>
            <motion.span
              className="inline-block w-1.5 h-1.5 ml-1 bg-blue-500 rounded-full"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            <motion.span
              className="inline-block w-1.5 h-1.5 ml-0.5 bg-blue-500 rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
            />
            <motion.span
              className="inline-block w-1.5 h-1.5 ml-0.5 bg-blue-500 rounded-full"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.6 }}
            />
            </>
          )}
        </span>

        <Trophy size={18} className="text-gray-400" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {board.map((cell, index) => {
          const isWinCell = winningLine?.includes(index) ?? false;
          const isLast = lastMoveIndex === index;

          return (
            <motion.button
              key={index}
              onClick={() => handleClick(index)}
              disabled={cell !== null || gameStatus !== 'playing'}
              initial={cell ? { scale: 0, opacity: 0 } : undefined}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={clsx(
                'aspect-square rounded-xl flex items-center justify-center',
                'font-bold text-3xl cursor-pointer',
                'transition-colors',
                cell === null && gameStatus === 'playing' && !isAIThinking
                  ? 'hover:bg-black/5 dark:hover:bg-white/5'
                  : 'cursor-default',
                isWinCell && 'bg-gradient-to-r from-green-400 to-emerald-500 animate-pulse',
                isLast && !isWinCell && 'ring-2 ring-blue-400'
              )}
            >
              {cell === 'X' && <span className="text-[#007AFF]">X</span>}
              {cell === 'O' && <span className="text-[#FF3B30]">O</span>}
            </motion.button>
          );
        })}
      </div>

      <div className="flex gap-3 w-full">
        <button
          onClick={surrender}
          disabled={gameStatus !== 'playing'}
          className={clsx(
            'flex-1 py-2 px-4 rounded-lg font-medium border-2 transition-all',
            gameStatus === 'playing'
              ? 'border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
              : 'border-gray-300 text-gray-400 cursor-not-allowed dark:border-gray-700'
          )}
        >
          认输
        </button>
        <button
          onClick={resetBoard}
          className="flex-1 py-2 px-4 rounded-lg font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all"
        >
          再来一局
        </button>
      </div>

      <AnimatePresence>
        {gameStatus !== 'playing' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={resetBoard}
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -30, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl text-center space-y-3 min-w-[240px]"
            >
              <p className="text-4xl">{resultConfig[gameStatus].emoji}</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {resultConfig[gameStatus].text}
              </p>
              {resultConfig[gameStatus].score && (
                <p className={clsx(
                  'text-lg font-semibold',
                  gameStatus === 'won' ? 'text-green-600' : 'text-red-600'
                )}>
                  {resultConfig[gameStatus].score}
                </p>
              )}
              <button
                onClick={resetBoard}
                className="mt-4 w-full py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-all"
              >
                再来一局
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
