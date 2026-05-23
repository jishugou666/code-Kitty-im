import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';

interface GomokuBoardProps {
  matchId?: number;
  onGameOver?: (result: 'win' | 'loss' | 'draw') => void;
  aiDifficulty?: string;
  mode?: 'ai';
}

const BOARD_SIZE = 15;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

type Board = number[][];
type GameStatus = 'playing' | 'won' | 'lost' | 'draw';
type Position = [number, number];

interface MoveRecord {
  row: number;
  col: number;
  player: number;
}

const STAR_POINTS: [number, number][] = [
  [3, 3], [3, 7], [3, 11],
  [7, 3], [7, 7], [7, 11],
  [11, 3], [11, 7], [11, 11]
];

const DIRECTIONS: [number, number][] = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1]
];

function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array(BOARD_SIZE).fill(EMPTY)
  );
}

function checkFive(
  row: number,
  col: number,
  player: number,
  board: Board
): Position[] {
  for (const [dx, dy] of DIRECTIONS) {
    const line: Position[] = [[row, col]];

    for (let i = 1; i < 5; i++) {
      const nr = row + dx * i;
      const nc = col + dy * i;
      if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === player) {
        line.push([nr, nc]);
      } else break;
    }

    for (let i = 1; i < 5; i++) {
      const nr = row - dx * i;
      const nc = col - dy * i;
      if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] === player) {
        line.push([nr, nc]);
      } else break;
    }

    if (line.length >= 5) return line;
  }
  return [];
}

function countLine(
  board: Board,
  row: number,
  col: number,
  dx: number,
  dy: number,
  player: number
): { count: number; openEnds: number } {
  let count = 1;
  let openEnds = 0;

  for (let i = 1; i < 5; i++) {
    const nr = row + dx * i;
    const nc = col + dy * i;
    if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) break;
    if (board[nr][nc] === player) count++;
    else if (board[nr][nc] === EMPTY) {
      openEnds++;
      break;
    } else break;
  }

  for (let i = 1; i < 5; i++) {
    const nr = row - dx * i;
    const nc = col - dy * i;
    if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) break;
    if (board[nr][nc] === player) count++;
    else if (board[nr][nc] === EMPTY) {
      openEnds++;
      break;
    } else break;
  }

  return { count, openEnds };
}

function scorePosition(
  board: Board,
  row: number,
  col: number,
  player: number
): number {
  let totalScore = 0;

  for (const [dx, dy] of DIRECTIONS) {
    const { count, openEnds } = countLine(board, row, col, dx, dy, player);

    if (count >= 5) totalScore += 100000;
    else if (count === 4 && openEnds === 2) totalScore += 15000;
    else if (count === 4 && openEnds === 1) totalScore += 5000;
    else if (count === 3 && openEnds === 2) totalScore += 2000;
    else if (count === 3 && openEnds === 1) totalScore += 500;
    else if (count === 2 && openEnds === 2) totalScore += 100;
    else if (count === 2 && openEnds === 1) totalScore += 10;
    else if (count === 1 && openEnds === 2) totalScore += 10;
  }

  return totalScore;
}

function getAIPosition(
  board: Board,
  difficulty: string
): Position {
  const candidates: Position[] = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== EMPTY) continue;

      const hasNeighbor = DIRECTIONS.some(([dx, dy]) => {
        const nr = r + dx;
        const nc = c + dy;
        return nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] !== EMPTY;
      });

      if (hasNeighbor || (r === 7 && c === 7)) {
        candidates.push([r, c]);
      }
    }
  }

  if (candidates.length === 0) return [7, 7];

  if (difficulty === 'easy') {
    if (Math.random() < 0.4) {
      return candidates[Math.floor(Math.random() * candidates.length)];
    }
    let bestScore = -Infinity;
    let bestMove = candidates[0];
    for (const [r, c] of candidates) {
      const myScore = scorePosition(board, r, c, WHITE);
      const defScore = scorePosition(board, r, c, BLACK);
      const combined = Math.max(myScore, defScore * 0.8);
      if (combined > bestScore) {
        bestScore = combined;
        bestMove = [r, c];
      }
    }
    return bestMove;
  }

  let bestScore = -Infinity;
  let bestMove = candidates[0];
  for (const [r, c] of candidates) {
    const myScore = scorePosition(board, r, c, WHITE);
    const oppScore = scorePosition(board, r, c, BLACK);
    const combined = myScore - oppScore * 1.1;
    if (combined > bestScore) {
      bestScore = combined;
      bestMove = [r, c];
    }
  }
  return bestMove;
}

export function GomokuBoard({
  matchId: _matchId,
  onGameOver,
  aiDifficulty = 'medium',
  mode = 'ai'
}: GomokuBoardProps) {
  const [board, setBoard] = useState<Board>(createEmptyBoard);
  const [currentPlayer, setCurrentPlayer] = useState<number>(BLACK);
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [lastMove, setLastMove] = useState<Position | null>(null);
  const [winningCells, setWinningCells] = useState<Position[] | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [history, setHistory] = useState<MoveRecord[]>([]);

  const isFull = board.every(row => row.every(cell => cell !== EMPTY));

  const handleClick = useCallback((row: number, col: number) => {
    if (
      board[row][col] !== EMPTY ||
      gameStatus !== 'playing' ||
      currentPlayer !== BLACK ||
      isAIThinking
    ) {
      return;
    }

    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = BLACK;
    setBoard(newBoard);
    setCurrentPlayer(WHITE);
    setLastMove([row, col]);
    setHistory(h => [...h, { row, col, player: BLACK }]);

    const winCells = checkFive(row, col, BLACK, newBoard);
    if (winCells.length > 0) {
      setWinningCells(winCells);
      setGameStatus('won');
      onGameOver?.('win');
      return;
    }

    if (newBoard.every(r => r.every(c => c !== EMPTY))) {
      setGameStatus('draw');
      onGameOver?.('draw');
      return;
    }

    setIsAIThinking(true);
  }, [board, gameStatus, currentPlayer, isAIThinking, onGameOver]);

  useEffect(() => {
    if (!isAIThinking || gameStatus !== 'playing') return;

    const timer = setTimeout(() => {
      const currentBoard = board.map(r => [...r]);
      const [aiRow, aiCol] = getAIPosition(currentBoard, aiDifficulty);

      const newBoard = board.map(r => [...r]);
      newBoard[aiRow][aiCol] = WHITE;
      setBoard(newBoard);
      setCurrentPlayer(BLACK);
      setLastMove([aiRow, aiCol]);
      setHistory(h => [...h, { row: aiRow, col: aiCol, player: WHITE }]);
      setIsAIThinking(false);

      const winCells = checkFive(aiRow, aiCol, WHITE, newBoard);
      if (winCells.length > 0) {
        setWinningCells(winCells);
        setGameStatus('lost');
        onGameOver?.('loss');
        return;
      }

      if (newBoard.every(r => r.every(c => c !== EMPTY))) {
        setGameStatus('draw');
        onGameOver?.('draw');
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [isAIThinking, gameStatus, board, aiDifficulty, onGameOver]);

  const resetBoard = () => {
    setBoard(createEmptyBoard());
    setCurrentPlayer(BLACK);
    setGameStatus('playing');
    setLastMove(null);
    setWinningCells(null);
    setIsAIThinking(false);
    setHistory([]);
  };

  const surrender = () => {
    if (gameStatus === 'playing') {
      setGameStatus('lost');
      onGameOver?.('loss');
    }
  };

  const statusText = gameStatus !== 'playing'
    ? ''
    : isAIThinking
    ? '⚪ AI 思考中... (白方)'
    : '⚫ 你的回合 (黑方)';

  const resultConfig = {
    won: { emoji: '✨', text: '五子连珠!' },
    lost: { emoji: '', text: '再接再厉' },
    draw: { emoji: '', text: '势均力敌' }
  };

  const isStarPoint = (r: number, c: number): boolean =>
    STAR_POINTS.some(([sr, sc]) => sr === r && sc === c);

  return (
    <div className="max-w-lg mx-auto flex flex-col items-center gap-3">
      <div className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/60 text-center">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {statusText}
        </span>
      </div>

      <div className="overflow-auto rounded-xl p-2 bg-amber-100 dark:bg-amber-900/20 shadow-inner">
        <div
          className="grid gap-px"
          style={{
            gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`
          }}
        >
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const isWinCell =
                winningCells?.some(([wr, wc]) => wr === rowIndex && wc === colIndex) ?? false;
              const isLastMove =
                lastMove?.[0] === rowIndex && lastMove?.[1] === colIndex;
              const star = isStarPoint(rowIndex, colIndex) && cell === EMPTY;

              return (
                <motion.button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => handleClick(rowIndex, colIndex)}
                  disabled={cell !== EMPTY || gameStatus !== 'playing'}
                  initial={cell ? { scale: 0, opacity: 0 } : undefined}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className={clsx(
                    'aspect-square rounded-sm relative cursor-pointer',
                    'transition-colors',
                    cell === EMPTY && gameStatus === 'playing' &&
                      !isAIThinking && currentPlayer === BLACK
                      ? 'bg-amber-200/50 dark:bg-amber-800/30 hover:bg-amber-300/70'
                      : 'bg-amber-200/50 dark:bg-amber-800/30',
                    isLastMove && !isWinCell && 'ring-2 ring-red-400 ring-inset z-10',
                    isWinCell && 'ring-2 ring-green-400 ring-inset animate-pulse'
                  )}
                >
                  {star && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-800/50" />
                    </div>
                  )}

                  {cell === BLACK && (
                    <div
                      className="absolute m-auto w-4/5 h-4/5 rounded-full shadow-md"
                      style={{
                        background: 'radial-gradient(circle at 35% 35%, #d4d4d4, #6b7280 40%, #1f2937)'
                      }}
                    />
                  )}

                  {cell === WHITE && (
                    <div
                      className="absolute m-auto w-4/5 h-4/5 rounded-full shadow-md border border-gray-300"
                      style={{
                        background: 'radial-gradient(circle at 35% 35%, #ffffff, #f3f4f6 40%, #d1d5db)'
                      }}
                    />
                  )}
                </motion.button>
              );
            })
          )}
        </div>
      </div>

      <div className="flex gap-3 w-full max-w-md px-4">
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
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl text-center space-y-3 min-w-[260px]"
            >
              <p className="text-3xl">{resultConfig[gameStatus].emoji}</p>
              <p className="text-xl font-bold text-gray-800 dark:text-gray-200">
                {resultConfig[gameStatus].text}
              </p>
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
