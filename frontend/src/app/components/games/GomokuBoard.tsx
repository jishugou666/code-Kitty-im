import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { gameApi } from '../../api/game';

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
const MAX_UNDO = 20;

type Board = number[][];
type GameStatus = 'playing' | 'won' | 'lost' | 'draw';
type Position = [number, number];

interface MoveRecord {
  row: number;
  col: number;
  player: number;
  timestamp: number;
}

interface GameStats {
  totalMoves: number;
  blackCount: number;
  whiteCount: number;
  duration: number;
}

const COL_LABELS = 'ABCDEFGHIJKLMNO';

const STAR_POINTS: [number, number][] = [
  [3, 3], [3, 7], [3, 11],
  [7, 3], [7, 7], [7, 11],
  [11, 3], [11, 7], [11, 11]
];

const DIRECTIONS: [number, number][] = [
  [1, 0], [0, 1], [1, 1], [1, -1]
];

const DIFFICULTY_CONFIG = {
  easy: {
    label: '新手模式',
    desc: '适合初学者',
    thinkTime: 1200,
    color: 'text-green-500',
    bgColor: 'bg-green-500',
    barColor: 'bg-green-500'
  },
  medium: {
    label: '普通模式',
    desc: '有一定挑战',
    thinkTime: 900,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500',
    barColor: 'bg-yellow-500'
  },
  hard: {
    label: '专家模式',
    desc: '极具挑战',
    thinkTime: 600,
    color: 'text-red-500',
    bgColor: 'bg-red-500',
    barColor: 'bg-red-500'
  }
};

const PATTERN_SCORES = {
  FIVE: 10000000,
  LIVE_FOUR: 500000,
  RUSH_FOUR: 50000,
  LIVE_THREE: 10000,
  SLEEP_THREE: 1000,
  LIVE_TWO: 500,
  SLEEP_TWO: 50,
  LIVE_ONE: 10,
} as const;

const COMBO_SCORES = {
  DOUBLE_FOUR: 500000,
  DOUBLE_THREE: 50000,
  FOUR_THREE: 500000,
} as const;

interface LineInfo {
  count: number;
  blocked: number;
  openEnds: number;
}

function scanLine(board: Board, row: number, col: number, dx: number, dy: number, player: number): LineInfo {
  let count = 1;
  let blocked = 0;
  let openEnds = 0;
  for (let i = 1; i <= 5; i++) {
    const nr = row + dx * i;
    const nc = col + dy * i;
    if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) { blocked++; break; }
    if (board[nr][nc] === player) count++;
    else if (board[nr][nc] === EMPTY) { openEnds++; break; }
    else { blocked++; break; }
  }
  for (let i = 1; i <= 5; i++) {
    const nr = row - dx * i;
    const nc = col - dy * i;
    if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) { blocked++; break; }
    if (board[nr][nc] === player) count++;
    else if (board[nr][nc] === EMPTY) { openEnds++; break; }
    else { blocked++; break; }
  }
  return { count, blocked, openEnds };
}

function patternScoreFromLine(count: number, blocked: number, openEnds: number): number {
  if (count >= 5) return PATTERN_SCORES.FIVE;
  if (blocked >= 2) return 0;
  if (count === 4) {
    if (openEnds === 2) return PATTERN_SCORES.LIVE_FOUR;
    if (openEnds === 1) return PATTERN_SCORES.RUSH_FOUR;
    return 0;
  }
  if (count === 3) {
    if (openEnds === 2) return PATTERN_SCORES.LIVE_THREE;
    if (openEnds === 1) return PATTERN_SCORES.SLEEP_THREE;
    return 0;
  }
  if (count === 2) {
    if (openEnds === 2) return PATTERN_SCORES.LIVE_TWO;
    if (openEnds === 1) return PATTERN_SCORES.SLEEP_TWO;
    return 0;
  }
  if (count === 1 && openEnds === 2) return PATTERN_SCORES.LIVE_ONE;
  return 0;
}

function evaluatePoint(board: Board, row: number, col: number, player: number): number {
  let totalScore = 0;
  for (const [dx, dy] of DIRECTIONS) {
    const line = scanLine(board, row, col, dx, dy, player);
    totalScore += patternScoreFromLine(line.count, line.blocked, line.openEnds);
  }
  return totalScore;
}

function analyzePatterns(board: Board, row: number, col: number, player: number): { liveFour: number; rushFour: number; liveThree: number; sleepThree: number } {
  let liveFour = 0, rushFour = 0, liveThree = 0, sleepThree = 0;
  for (const [dx, dy] of DIRECTIONS) {
    const line = scanLine(board, row, col, dx, dy, player);
    if (line.count >= 5) continue;
    if (line.count === 4 && line.openEnds === 2) liveFour++;
    else if (line.count === 4 && line.openEnds === 1) rushFour++;
    else if (line.count === 3 && line.openEnds === 2) liveThree++;
    else if (line.count === 3 && line.openEnds === 1) sleepThree++;
  }
  return { liveFour, rushFour, liveThree, sleepThree };
}

function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(EMPTY));
}

function checkFive(row: number, col: number, player: number, board: Board): Position[] {
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

function hasNeighborWithinRadius(board: Board, r: number, c: number, radius: number): boolean {
  for (let dr = -radius; dr <= radius; dr++)
    for (let dc = -radius; dc <= radius; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && board[nr][nc] !== EMPTY)
        return true;
    }
  return false;
}

function getCandidates(board: Board): Position[] {
  const candidates: Position[] = [];
  const hasPiece = board.some(r => r.some(c => c !== EMPTY));
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== EMPTY) continue;
      if (!hasPiece || hasNeighborWithinRadius(board, r, c, 2)) {
        candidates.push([r, c]);
      }
    }
  }
  if (candidates.length === 0) return [[7, 7]];
  candidates.sort((a, b) => {
    const scoreA = quickEval(board, a[0], a[1]);
    const scoreB = quickEval(board, b[0], b[1]);
    return scoreB - scoreA;
  });
  return candidates.slice(0, 20);
}

function quickEval(board: Board, r: number, c: number): number {
  return Math.max(evaluatePoint(board, r, c, WHITE), evaluatePoint(board, r, c, BLACK));
}

function findWinningMove(board: Board, player: number): Position | null {
  const candidates = getCandidates(board);
  for (const [r, c] of candidates) {
    if (board[r][c] !== EMPTY) continue;
    for (const [dx, dy] of DIRECTIONS) {
      const line = scanLine(board, r, c, dx, dy, player);
      if (line.count >= 5) return [r, c];
    }
  }
  for (const [r, c] of candidates) {
    if (board[r][c] !== EMPTY) continue;
    const patterns = analyzePatterns(board, r, c, player);
    if (patterns.liveFour > 0) return [r, c];
  }
  return null;
}

function findCriticalDefensiveMove(board: Board, defender: number, attacker: number): Position | null {
  const candidates = getCandidates(board);
  let bestMove: Position | null = null;
  let bestPriority = -1;
  for (const [r, c] of candidates) {
    if (board[r][c] !== EMPTY) continue;
    const atkPatterns = analyzePatterns(board, r, c, attacker);
    let priority = -1;
    if (atkPatterns.liveFour > 0) priority = 50;
    else if (atkPatterns.rushFour > 0) priority = 40;
    else if (atkPatterns.liveThree >= 2) priority = 35;
    else if (atkPatterns.liveThree >= 1 && atkPatterns.sleepThree >= 1) priority = 30;
    else if (atkPatterns.liveThree >= 1) priority = 20;
    else if (atkPatterns.sleepThree >= 2) priority = 15;
    if (priority > bestPriority) {
      bestPriority = priority;
      bestMove = [r, c];
    }
  }
  return bestMove;
}

function searchVCF(board: Board, depth: number, aiPlayer: number, humanPlayer: number): Position | null {
  if (depth <= 0) return null;
  const candidates = getCandidates(board).slice(0, 10);
  const vcfMoves: Position[] = [];
  for (const [r, c] of candidates) {
    if (board[r][c] !== EMPTY) continue;
    const patterns = analyzePatterns(board, r, c, aiPlayer);
    if (patterns.rushFour > 0 || patterns.liveFour > 0) {
      vcfMoves.push([r, c]);
    }
  }
  for (const move of vcfMoves) {
    const [mr, mc] = move;
    board[mr][mc] = aiPlayer;
    if (checkFive(mr, mc, aiPlayer, board).length > 0) {
      board[mr][mc] = EMPTY;
      return move;
    }
    const blockMove = findWinningMove(board, humanPlayer);
    if (blockMove) {
      const [br, bc] = blockMove;
      board[br][bc] = humanPlayer;
      const result = searchVCF(board, depth - 1, aiPlayer, humanPlayer);
      board[br][bc] = EMPTY;
      board[mr][mc] = EMPTY;
      if (result) return move;
    } else {
      board[mr][mc] = EMPTY;
    }
  }
  return null;
}

function evaluateBoardForAI(board: Board): number {
  let score = 0;
  for (let r = 0; r < BOARD_SIZE; r++)
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === WHITE) {
        const ep = evaluatePoint(board, r, c, WHITE);
        score += ep * 1.05;
        const centerBonus = (6 - Math.abs(r - 7)) + (6 - Math.abs(c - 7));
        score += centerBonus * 8;
      } else if (board[r][c] === BLACK) {
        score -= evaluatePoint(board, r, c, BLACK) * 1.1;
      }
    }
  return score;
}

function minimaxAB(board: Board, depth: number, alpha: number, beta: number, isMaximizing: boolean): number {
  if (depth <= 0) return evaluateBoardForAI(board);
  const candidates = getCandidates(board).slice(0, 15);
  const scored = candidates
    .map(([r, c]) => ({
      pos: [r, c] as Position,
      s: evaluatePoint(board, r, c, isMaximizing ? WHITE : BLACK) +
         evaluatePoint(board, r, c, isMaximizing ? BLACK : WHITE) * 0.9
    }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 10);
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const { pos: [r, c] } of scored) {
      board[r][c] = WHITE;
      const winCheck = checkFive(r, c, WHITE, board);
      if (winCheck.length > 0) { board[r][c] = EMPTY; return PATTERN_SCORES.FIVE; }
      const eval_ = minimaxAB(board, depth - 1, alpha, beta, false);
      board[r][c] = EMPTY;
      maxEval = Math.max(maxEval, eval_);
      alpha = Math.max(alpha, eval_);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const { pos: [r, c] } of scored) {
      board[r][c] = BLACK;
      const winCheck = checkFive(r, c, BLACK, board);
      if (winCheck.length > 0) { board[r][c] = EMPTY; return -PATTERN_SCORES.FIVE; }
      const eval_ = minimaxAB(board, depth - 1, alpha, beta, true);
      board[r][c] = EMPTY;
      minEval = Math.min(minEval, eval_);
      beta = Math.min(beta, eval_);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

function aiEasy(board: Board): Position {
  const candidates = getCandidates(board);
  if (candidates.length === 0) return [7, 7];
  if (Math.random() < 0.6) {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }
  let bestScore = -Infinity;
  let bestMove = candidates[0];
  for (const [r, c] of candidates) {
    let maxThreat = 0;
    const defPatterns = analyzePatterns(board, r, c, BLACK);
    if (defPatterns.liveFour > 0) maxThreat = PATTERN_SCORES.LIVE_FOUR;
    else if (defPatterns.rushFour > 0) maxThreat = PATTERN_SCORES.RUSH_FOUR;
    else if (defPatterns.liveThree > 0) maxThreat = PATTERN_SCORES.LIVE_THREE;
    const atkScore = evaluatePoint(board, r, c, WHITE);
    const combined = Math.max(atkScore, maxThreat * 0.85);
    if (combined > bestScore) { bestScore = combined; bestMove = [r, c]; }
  }
  return bestMove;
}

function aiMedium(board: Board): Position {
  const winMove = findWinningMove(board, WHITE);
  if (winMove) return winMove;
  const blockMove = findWinningMove(board, BLACK);
  if (blockMove) return blockMove;
  const candidates = getCandidates(board).slice(0, 15);
  let bestScore = -Infinity;
  let bestMove = candidates[0] || [7, 7];
  const scored = candidates.map(([r, c]) => ({
    pos: [r, c] as Position,
    s: evaluatePoint(board, r, c, WHITE) + evaluatePoint(board, r, c, BLACK) * 1.0
  })).sort((a, b) => b.s - a.s).slice(0, 10);
  for (const { pos: [r, c] } of scored) {
    board[r][c] = WHITE;
    const score = minimaxAB(board, 2, -Infinity, Infinity, false);
    board[r][c] = EMPTY;
    if (score > bestScore) { bestScore = score; bestMove = [r, c]; }
  }
  return bestMove;
}

function aiHard(board: Board, moveNum: number): Position {
  if (moveNum === 0) return [7, 7];
  if (moveNum === 1 && board[7][7] === BLACK) {
    const offsets = [[7,8],[8,8],[8,7],[7,6],[6,6],[6,7],[6,8],[8,6]];
    for (const [r, c] of offsets) if (board[r][c] === EMPTY) return [r, c];
  }
  const aiWin = findWinningMove(board, WHITE);
  if (aiWin) return aiWin;
  const humanWin = findWinningMove(board, BLACK);
  if (humanWin) return humanWin;
  const criticalBlock = findCriticalDefensiveMove(board, WHITE, BLACK);
  if (criticalBlock) {
    const blockPatterns = analyzePatterns(board, criticalBlock[0], criticalBlock[1], BLACK);
    if (blockPatterns.liveFour > 0 || blockPatterns.rushFour > 0 ||
        blockPatterns.liveThree >= 2 || (blockPatterns.liveThree >= 1 && blockPatterns.sleepThree >= 1))
      return criticalBlock;
  }
  const vcfResult = searchVCF(board, 8, WHITE, BLACK);
  if (vcfResult) return vcfResult;
  const candidates = getCandidates(board);
  let bestScore = -Infinity;
  let bestMove = candidates[0] || [7, 7];
  const scored = candidates.map(([r, c]) => ({
    pos: [r, c] as Position,
    s: evaluatePoint(board, r, c, WHITE) * 1.15 + evaluatePoint(board, r, c, BLACK) * 1.1
  })).sort((a, b) => b.s - a.s).slice(0, 10);
  for (const { pos: [r, c] } of scored) {
    board[r][c] = WHITE;
    const score = minimaxAB(board, 4, -Infinity, Infinity, false);
    board[r][c] = EMPTY;
    const centerBonus = (6 - Math.abs(r - 7)) + (6 - Math.abs(c - 7));
    const finalScore = score + centerBonus * 30;
    if (finalScore > bestScore) { bestScore = finalScore; bestMove = [r, c]; }
  }
  return bestMove;
}

function getAIPosition(board: Board, difficulty: string, moveNum: number): Position {
  switch (difficulty) {
    case 'easy': return aiEasy(board);
    case 'medium': return aiMedium(board);
    case 'hard': return aiHard(board, moveNum);
    default: return aiMedium(board);
  }
}

function evaluateBoard(board: Board): { attack: number; defense: number } {
  let attack = 0, defense = 0;
  for (let r = 0; r < BOARD_SIZE; r++)
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === WHITE) attack += evaluatePoint(board, r, c, WHITE);
      else if (board[r][c] === BLACK) defense += evaluatePoint(board, r, c, BLACK);
    }
  return { attack, defense };
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function getCoordLabel(row: number, col: number): string {
  return `${COL_LABELS[col]}${row + 1}`;
}

const Stone = React.memo(({ player, isWin, isLast }: { player: number; isWin: boolean; isLast: boolean }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ type: 'spring', stiffness: 350, damping: 18 }}
    className={clsx(
      'absolute m-auto w-[78%] h-[78%] rounded-full z-10',
      isWin && 'animate-pulse'
    )}
    style={
      player === BLACK
        ? {
            background: 'radial-gradient(circle at 35% 30%, #888, #444 45%, #1a1a1a 80%, #000)',
            boxShadow: 'inset 2px 2px 4px rgba(255,255,255,0.15), inset -2px -2px 4px rgba(0,0,0,0.5), 2px 3px 6px rgba(0,0,0,0.5)',
            ...(isWin ? { boxShadow: 'inset 2px 2px 4px rgba(255,255,255,0.15), inset -2px -2px 4px rgba(0,0,0,0.5), 0 0 16px 4px rgba(34,197,94,0.7), 2px 3px 6px rgba(0,0,0,0.5)' } : {})
          }
        : {
            background: 'radial-gradient(circle at 35% 30%, #fff, #f0f0f0 40%, #d8d8d8 80%, #bbb)',
            border: '1px solid #ccc',
            boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.9), inset -1px -1px 2px rgba(0,0,0,0.12), 2px 3px 6px rgba(0,0,0,0.35)',
            ...(isWin ? { boxShadow: 'inset 1px 1px 2px rgba(255,255,255,0.9), inset -1px -1px 2px rgba(0,0,0,0.12), 0 0 16px 4px rgba(34,197,94,0.7), 2px 3px 6px rgba(0,0,0,0.35)' } : {})
          }
    }
  >
    {isLast && (
      <div className={clsx(
        'absolute inset-0 m-auto w-[40%] h-[40%] rounded-full border-2 pointer-events-none',
        player === BLACK ? 'border-red-400' : 'border-blue-400'
      )} />
    )}
  </motion.div>
));

Stone.displayName = 'Stone';

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
  const [hoverPos, setHoverPos] = useState<Position | null>(null);
  const [undoCount, setUndoCount] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [previewStep, setPreviewStep] = useState<number | null>(null);
  const [previewBoard, setPreviewBoard] = useState<Board | null>(null);
  const [aiThinkProgress, setAiThinkProgress] = useState(0);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [matchId, setMatchId] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const config = DIFFICULTY_CONFIG[aiDifficulty as keyof typeof DIFFICULTY_CONFIG] || DIFFICULTY_CONFIG.medium;

  useEffect(() => {
    const initMatch = async () => {
      try {
        const res = await gameApi.createMatch({
          game_type: 'gomoku',
          mode: 'ai',
          ai_difficulty: aiDifficulty
        });
        if (res.code === 200 && res.data) {
          setMatchId(res.data.id);
        }
      } catch (e) {
        console.log('[Gomoku] 创建对局失败，离线模式');
      }
    };
    initMatch();
  }, []);

  useEffect(() => {
    if (gameStatus === 'playing' && !isAIThinking) {
      timerRef.current = setInterval(() => setTimerSeconds(s => s + 1), 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [gameStatus, isAIThinking]);

  useEffect(() => {
    if (!isAIThinking || gameStatus !== 'playing') return;
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 25 + 10;
      if (progress > 95) progress = 90 + Math.random() * 8;
      setAiThinkProgress(progress);
    }, config.thinkTime / 8);
    const timer = setTimeout(() => {
      clearInterval(interval);
      setAiThinkProgress(100);
      const currentBoard = board.map(r => [...r]);
      const [aiRow, aiCol] = getAIPosition(currentBoard, aiDifficulty, history.filter(h => h.player === WHITE).length);
      const newBoard = board.map(r => [...r]);
      newBoard[aiRow][aiCol] = WHITE;
      setBoard(newBoard);
      setCurrentPlayer(BLACK);
      setLastMove([aiRow, aiCol]);
      setHistory(h => [...h, { row: aiRow, col: aiCol, player: WHITE, timestamp: Date.now() }]);
      setIsAIThinking(false);
      setAiThinkProgress(0);
      if (matchId) {
        gameApi.move(matchId, { position: [aiRow, aiCol], symbol: 'W' }).catch(() => {});
      }
      const winCells = checkFive(aiRow, aiCol, WHITE, newBoard);
      if (winCells.length > 0) {
        setWinningCells(winCells);
        setGameStatus('lost');
        saveGameResult('lost');
        onGameOver?.('loss');
        return;
      }
      if (newBoard.every(r => r.every(c => c !== EMPTY))) {
        setGameStatus('draw');
        saveGameResult('draw');
        onGameOver?.('draw');
      }
    }, config.thinkTime);
    return () => { clearTimeout(timer); clearInterval(interval); setAiThinkProgress(0); };
  }, [isAIThinking, gameStatus, board, aiDifficulty, onGameOver, config.thinkTime, history, matchId]);

  const stats: GameStats = useMemo(() => ({
    totalMoves: history.length,
    blackCount: history.filter(h => h.player === BLACK).length,
    whiteCount: history.filter(h => h.player === WHITE).length,
    duration: timerSeconds
  }), [history, timerSeconds]);

  const evaluation = useMemo(() => evaluateBoard(board), [board]);
  const evalTotal = evaluation.attack + evaluation.defense || 1;
  const attackPercent = Math.min(100, Math.round((evaluation.attack / evalTotal) * 100));
  const canUndo = gameStatus === 'playing' && undoCount < MAX_UNDO && history.length >= 2 && !isAIThinking;

  const handleClick = useCallback((row: number, col: number) => {
    if (board[row][col] !== EMPTY || gameStatus !== 'playing' || currentPlayer !== BLACK || isAIThinking) return;
    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = BLACK;
    setBoard(newBoard);
    setCurrentPlayer(WHITE);
    setLastMove([row, col]);
    setHistory(h => [...h, { row, col, player: BLACK, timestamp: Date.now() }]);
    setPreviewStep(null);
    setPreviewBoard(null);
    if (matchId) {
      gameApi.move(matchId, { position: [row, col], symbol: 'B' }).catch(() => {});
    }
    const winCells = checkFive(row, col, BLACK, newBoard);
    if (winCells.length > 0) {
      setWinningCells(winCells);
      setGameStatus('won');
      saveGameResult('won');
      onGameOver?.('win');
      return;
    }
    if (newBoard.every(r => r.every(c => c !== EMPTY))) {
      setGameStatus('draw');
      saveGameResult('draw');
      onGameOver?.('draw');
      return;
    }
    setIsAIThinking(true);
  }, [board, gameStatus, currentPlayer, isAIThinking, onGameOver, matchId]);

  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    const newHistory = history.slice(0, -2);
    const restoredBoard = createEmptyBoard();
    for (const move of newHistory) {
      restoredBoard[move.row][move.col] = move.player;
    }
    setBoard(restoredBoard);
    setHistory(newHistory);
    setCurrentPlayer(BLACK);
    setLastMove(newHistory.length > 0 ? [newHistory[newHistory.length - 1].row, newHistory[newHistory.length - 1].col] : null);
    setWinningCells(null);
    setUndoCount(u => u + 1);
  }, [canUndo, history]);

  const handlePreview = useCallback((stepIndex: number) => {
    if (stepIndex >= history.length) { setPreviewStep(null); setPreviewBoard(null); return; }
    setPreviewStep(stepIndex);
    const previewB = createEmptyBoard();
    for (let i = 0; i <= stepIndex; i++) {
      const m = history[i];
      previewB[m.row][m.col] = m.player;
    }
    setPreviewBoard(previewB);
  }, [history]);

  const resetBoard = () => {
    setBoard(createEmptyBoard());
    setCurrentPlayer(BLACK);
    setGameStatus('playing');
    setLastMove(null);
    setWinningCells(null);
    setIsAIThinking(false);
    setHistory([]);
    setHoverPos(null);
    setUndoCount(0);
    setTimerSeconds(0);
    setShowHistory(false);
    setPreviewStep(null);
    setPreviewBoard(null);
    setShowAnalysis(false);
    setAiThinkProgress(0);
    const initNewMatch = async () => {
      try {
        const res = await gameApi.createMatch({
          game_type: 'gomoku',
          mode: 'ai',
          ai_difficulty: aiDifficulty
        });
        if (res.code === 200 && res.data) {
          setMatchId(res.data.id);
        }
      } catch (e) {}
    };
    initNewMatch();
  };

  const surrender = async () => {
    if (gameStatus === 'playing') {
      if (matchId) {
        try { await gameApi.surrender(matchId); } catch (e) {}
      }
      setGameStatus('lost');
      saveGameResult('lost');
      onGameOver?.('loss');
    }
  };

  const saveGameResult = (result: 'win' | 'loss' | 'draw') => {
    try {
      const key = 'gomoku_stats';
      const raw = localStorage.getItem(key);
      const data = raw ? JSON.parse(raw) : { wins: 0, losses: 0, draws: 0, games: 0 };
      if (result === 'won') data.wins++;
      else if (result === 'lost') data.losses++;
      else data.draws++;
      data.games++;
      localStorage.setItem(key, JSON.stringify(data));
    } catch {}
  };

  const statusText = gameStatus !== 'playing' ? '' : isAIThinking ? '\u26AA AI \u601d\u8003\u4e2d... (\u767d\u65b9)' : '\u26AB \u4f60\u7684\u56de\u5408 (\u9ed1\u65b9)';
  const resultConfig = {
    won: { emoji: '\u2728', text: '\u4e94\u5b50\u8fde\u73e0!', score: '+25', color: 'text-green-600' },
    lost: { emoji: '😔', text: '\u518d\u63a5\u518e\u5389', score: '-12', color: 'text-red-600' },
    draw: { emoji: '🤝', text: '\u52bf\u5747\u529b\u654c', score: '+5', color: 'text-yellow-600' }
  };
  const storedStats = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('gomoku_stats') || '{"wins":0,"losses":0,"draws":0,"games":0}'); }
    catch { return { wins: 0, losses: 0, draws: 0, games: 0 }; }
  }, []);

  const displayBoard = previewBoard || board;
  const isStarPoint = (r: number, c: number): boolean =>
    STAR_POINTS.some(([sr, sc]) => sr === r && sc === c);

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-4 p-2 lg:p-4 items-start relative overflow-hidden">
      <div className="flex-1 flex flex-col items-center gap-3 w-full lg:w-auto">
        {/* Top Info Bar */}
        <div className="w-full max-w-[560px] bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl px-4 py-2.5 shadow-sm border border-gray-200/60 dark:border-gray-700/50">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className={clsx(
                "text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap",
                gameStatus === 'playing' && !isAIThinking
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400"
              )}>
                {statusText}
              </span>
              {isAIThinking && (
                <div className="flex items-center gap-0.5">
                  {[0, 1, 2].map(i => (
                    <motion.span key={i}
                      className={clsx("w-1.5 h-1.5 rounded-full", config.bgColor)}
                      animate={{ opacity: [1, 0.3, 1], scale: [1, 0.8, 1] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.3 }}
                    />
                  ))}
                </div>
              )}
            </div>
            {hoverPos && gameStatus === 'playing' && !isAIThinking && (
              <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-md">
                {getCoordLabel(hoverPos[0], hoverPos[1])}
              </span>
            )}
            <span className="font-mono text-xs font-medium text-gray-600 dark:text-gray-400 ml-auto tabular-nums">
              {formatTime(timerSeconds)}
            </span>
          </div>
          {/* AI Thinking Progress Bar */}
          <AnimatePresence>
            {isAIThinking && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 6, opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <motion.div
                  className={clsx("h-full rounded-full transition-all", config.barColor)}
                  initial={{ width: '0%' }}
                  animate={{ width: `${aiThinkProgress}%` }}
                  transition={{ ease: 'linear', duration: config.thinkTime / 800 }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Board Container with Coordinates */}
        <div className="relative overflow-hidden rounded-2xl shadow-xl" style={{
          background: 'linear-gradient(145deg, #DEB887 0%, #D2A679 20%, #C9956A 50%, #BF8E5F 75%, #B58555 100%)',
          padding: '14px'
        }}>
          {/* Wood grain noise overlay */}
          <div className="absolute inset-0 opacity-[0.07] pointer-events-none rounded-2xl"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundSize: '180px 180px'
            }} />

          <div className="relative flex">
            {/* Column Labels Top */}
            <div className="ml-5" style={{ width: 'calc(var(--cell-size) * 15)' }}>
              <div className="flex justify-around mb-0.5">
                {COL_LABELS.split('').map(label => (
                  <span key={label} className="font-mono text-[10px] font-bold text-amber-900/50 dark:text-amber-200/50 w-text-center select-none" style={{ width: 'var(--cell-size)', textAlign: 'center', fontSize: '10px' }}>{label}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="relative flex">
            {/* Row Labels Left */}
            <div className="flex flex-col justify-around mr-0.5 pt-0" style={{ height: 'calc(var(--cell-size) * 15)' }}>
              {Array.from({ length: BOARD_SIZE }).map((_, i) => (
                <span key={i} className="font-mono text-[10px] font-bold text-amber-900/50 dark:text-amber-200/50 leading-none select-none flex items-center justify-end pr-0.5" style={{ height: 'var(--cell-size)', lineHeight: 'var(--cell-size)', fontSize: '10px' }}>{i + 1}</span>
              ))}
            </div>

            {/* Chess Board Grid */}
            <div
              className="relative"
              style={{
                '--cell-size': 'min(28px, calc((100vw - 140px) / 16))',
                width: 'calc(var(--cell-size) * 15)',
                height: 'calc(var(--cell-size) * 15)'
              } as React.CSSProperties}
            >
              {/* SVG Grid Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                {/* Outer double border */}
                <rect x="2" y="2" width="calc(100% - 4px)" height="calc(100% - 4px)" fill="none" stroke="#5D3A1A" strokeWidth="2.5" rx="1" />
                <rect x="5" y="5" width="calc(100% - 10px)" height="calc(100% - 10px)" fill="none" stroke="#5D3A1A" strokeWidth="1" rx="1" />
                {/* Inner grid lines */}
                {Array.from({ length: BOARD_SIZE }).map((_, i) => {
                  const offset = `calc(var(--cell-size) * ${i} + var(--cell-size) / 2)`;
                  return (
                    <g key={`g-${i}`}>
                      <line x1={offset} y1="calc(var(--cell-size) / 2)" x2={offset} y2="calc(100% - var(--cell-size) / 2)" stroke="#5D3A1A" strokeWidth="0.6" />
                      <line x1="calc(var(--cell-size) / 2)" y1={offset} x2="calc(100% - var(--cell-size) / 2)" y2={offset} stroke="#5D3A1A" strokeWidth="0.6" />
                    </g>
                  );
                })}
              </svg>

              {/* Star Points */}
              {STAR_POINTS.map(([sr, sc], idx) => {
                const cellVal = displayBoard[sr]?.[sc];
                if (cellVal !== EMPTY) return null;
                return (
                  <div key={`star-${idx}`}
                    className="absolute pointer-events-none z-[2]"
                    style={{
                      left: `calc(var(--cell-size) * ${sc})`,
                      top: `calc(var(--cell-size) * ${sr})`,
                      width: 'var(--cell-size)',
                      height: 'var(--cell-size)'
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-[7px] h-[7px] rounded-full bg-amber-900/60 dark:bg-amber-200/40" />
                    </div>
                  </div>
                );
              })}

              {/* Board Cells */}
              {displayBoard.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  const isWinCell = winningCells?.some(([wr, wc]) => wr === rowIndex && wc === colIndex) ?? false;
                  const isLast = lastMove?.[0] === rowIndex && lastMove?.[1] === colIndex && !previewBoard;
                  const star = isStarPoint(rowIndex, colIndex) && cell === EMPTY;
                  const isHover = hoverPos?.[0] === rowIndex && hoverPos?.[1] === colIndex
                    && cell === EMPTY && gameStatus === 'playing' && !isAIThinking && currentPlayer === BLACK;

                  return (
                    <button
                      key={`${rowIndex}-${colIndex}`}
                      onClick={() => handleClick(rowIndex, colIndex)}
                      onMouseEnter={() => setHoverPos([rowIndex, colIndex])}
                      onMouseLeave={() => setHoverPos(null)}
                      disabled={cell !== EMPTY || gameStatus !== 'playing' || isAIThinking}
                      className={clsx(
                        'absolute cursor-pointer outline-none',
                        'transition-colors duration-100',
                        cell === EMPTY && gameStatus === 'playing' && !isAIThinking && currentPlayer === BLACK
                          ? 'hover:bg-amber-400/20 active:bg-amber-400/30'
                          : ''
                      )}
                      style={{
                        left: `calc(var(--cell-size) * ${colIndex})`,
                        top: `calc(var(--cell-size) * ${rowIndex})`,
                        width: 'var(--cell-size)',
                        height: 'var(--cell-size)',
                        zIndex: isWinCell ? 12 : 5
                      }}
                    >
                      {star && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[2]">
                          <div className="w-[7px] h-[7px] rounded-full bg-amber-900/60 dark:bg-amber-200/40" />
                        </div>
                      )}

                      {/* Ghost piece on hover */}
                      {isHover && (
                        <motion.div
                          initial={{ scale: 0.7, opacity: 0 }}
                          animate={{ scale: 0.85, opacity: 0.45 }}
                          exit={{ scale: 0.7, opacity: 0 }}
                          className="absolute m-auto w-[78%] h-[78%] rounded-full z-[3] pointer-events-none"
                          style={{
                            background: 'radial-gradient(circle at 35% 30%, #888, #333 70%, #111)',
                            opacity: 0.35
                          }}
                        />
                      )}

                      {cell !== EMPTY && (
                        <Stone player={cell} isWin={isWinCell} isLast={isLast} />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2.5 w-full max-w-[560px] px-1">
          <button
            onClick={surrender}
            disabled={gameStatus !== 'playing'}
            className={clsx(
              'flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm border-2 transition-all',
              gameStatus === 'playing'
                ? 'border-red-400 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:border-red-500 dark:text-red-400'
                : 'border-gray-200 text-gray-300 cursor-not-allowed dark:border-gray-700'
            )}
          >
            认输
          </button>
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className={clsx(
              'flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm border-2 transition-all',
              canUndo
                ? 'border-amber-400 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 dark:border-amber-500 dark:text-amber-400'
                : 'border-gray-200 text-gray-300 cursor-not-allowed dark:border-gray-700'
            )}
          >
            悔棋 ({MAX_UNDO - undoCount})
          </button>
          <button
            onClick={() => setShowHistory(v => !v)}
            className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm border-2 border-indigo-400 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 dark:border-indigo-500 dark:text-indigo-400 transition-all"
          >
            {showHistory ? '收起历史' : '历史记录'}
          </button>
          <button
            onClick={resetBoard}
            className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all"
          >
            新局
          </button>
        </div>

        {/* Difficulty Info */}
        <div className={clsx("text-xs px-3 py-1.5 rounded-lg font-medium", config.color, "bg-opacity-10", `bg-${config.bgColor.replace('bg-', '')}/10`, "dark:bg-opacity-20")}>
          {config.label} - {config.desc}
        </div>

        {/* History Panel */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-[560px] overflow-hidden"
            >
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/60 dark:border-gray-700/50 p-3 shadow-sm mt-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">落子历史</span>
                  <span className="text-[10px] text-gray-400">{history.length} 步</span>
                </div>
                <div className="max-h-[200px] overflow-y-auto space-y-0.5 pr-1 scrollbar-thin">
                  {history.map((move, idx) => (
                    <button
                      key={idx}
                      onClick={() => handlePreview(idx)}
                      className={clsx(
                        "w-full flex items-center gap-2 px-2 py-1 rounded-md text-xs transition-colors",
                        previewStep === idx
                          ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-400"
                      )}
                    >
                      <span className="font-mono font-bold w-5 text-center text-gray-400">{idx + 1}</span>
                      <span className={clsx(
                        "w-4 h-4 rounded-full flex-shrink-0",
                        move.player === BLACK
                          ? "bg-gradient-to-br from-gray-600 to-black"
                          : "bg-gradient-to-br from-white to-gray-300 border border-gray-300"
                      )} />
                      <span className="font-mono font-semibold">{getCoordLabel(move.row, move.col)}</span>
                      <span className="text-[10px] text-gray-400 ml-auto tabular-nums">
                        {new Date(move.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </button>
                  ))}
                  {history.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">暂无落子记录</p>
                  )}
                </div>
                {previewStep !== null && (
                  <button
                    onClick={() => { setPreviewStep(null); setPreviewBoard(null); }}
                    className="mt-2 w-full text-xs text-indigo-500 hover:text-indigo-700 py-1"
                  >
                    ← 返回当前局面
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sidebar Stats */}
      <div className="w-full lg:w-[240px] flex flex-col gap-3 shrink-0">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/60 dark:border-gray-700/50 p-4 shadow-sm">
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">游戏统计</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">总步数</span>
              <span className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200">{stats.totalMoves}</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-gray-600 to-black" />
                <span className="text-xs text-gray-500">黑方</span>
              </div>
              <span className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200">{stats.blackCount}</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-white to-gray-300 border border-gray-300" />
                <span className="text-xs text-gray-500">白方</span>
              </div>
              <span className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200">{stats.whiteCount}</span>
            </div>
            <div className="border-t border-gray-100 dark:border-gray-700 pt-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">用时</span>
                <span className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200">{formatTime(stats.duration)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Evaluation Bar */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/60 dark:border-gray-700/50 p-4 shadow-sm">
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">局势评估</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px]">
              <span className="text-blue-600 dark:text-blue-400 font-medium">进攻力 (AI)</span>
              <span className="text-orange-600 dark:text-orange-400 font-medium">防守力 (你)</span>
            </div>
            <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
              <motion.div
                className="bg-gradient-to-r from-blue-500 to-blue-400 h-full"
                initial={{ width: 0 }}
                animate={{ width: `${attackPercent}%` }}
                transition={{ duration: 0.5 }}
              />
              <div className="flex-1 bg-gradient-to-r from-orange-400 to-orange-500 h-full" />
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 font-mono">
              <span>{evaluation.attack.toLocaleString()}</span>
              <span>{evaluation.defense.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Historical Record from localStorage */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/60 dark:border-gray-700/50 p-4 shadow-sm">
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">历史战绩</h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg py-2">
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{storedStats.wins}</p>
              <p className="text-[10px] text-green-600/70 dark:text-green-400/70">胜</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg py-2">
              <p className="text-lg font-bold text-red-600 dark:text-red-400">{storedStats.losses}</p>
              <p className="text-[10px] text-red-600/70 dark:text-red-400/70">负</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg py-2">
              <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{storedStats.draws}</p>
              <p className="text-[10px] text-yellow-600/70 dark:text-yellow-400/70">平</p>
            </div>
          </div>
          {storedStats.games > 0 && (
            <p className="text-[10px] text-gray-400 text-center mt-2">
              共 {storedStats.games} 局 · 胜率 {Math.round(storedStats.wins / storedStats.games * 100)}%
            </p>
          )}
        </div>
      </div>

      {/* Result Modal */}
      <AnimatePresence>
        {gameStatus !== 'playing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={resetBoard}
          >
            <motion.div
              initial={{ scale: 0.85, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: 30, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-4 min-w-[280px] max-w-[360px] w-full"
            >
              <motion.p
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', delay: 0.1, stiffness: 250 }}
                className="text-5xl"
              >
                {resultConfig[gameStatus].emoji}
              </motion.p>
              <div>
                <p className="text-xl font-bold text-gray-800 dark:text-gray-200">
                  {resultConfig[gameStatus].text}
                </p>
                <p className={clsx("text-base font-bold mt-1", resultConfig[gameStatus].color)}>
                  积分 {resultConfig[gameStatus].score}
                </p>
              </div>

              {/* Stats Summary */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 space-y-1.5 text-left">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">总步数</span>
                  <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">{stats.totalMoves}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">用时</span>
                  <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">{formatTime(stats.duration)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">平均思考</span>
                  <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">
                    {stats.totalMoves > 0 ? Math.round(config.thinkTime / 1000) + 's' : '-'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                {gameStatus !== 'draw' && (
                  <button
                    onClick={() => setShowAnalysis(true)}
                    className="w-full py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                  >
                    分析本局
                  </button>
                )}
                <button
                  onClick={resetBoard}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 shadow-md transition-all"
                >
                  再来一局
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analysis Modal */}
      <AnimatePresence>
        {showAnalysis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowAnalysis(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 shadow-2xl max-w-[380px] w-full max-h-[80vh] overflow-y-auto"
            >
              <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-3">本局分析</h3>
              <div className="space-y-2.5 text-sm">
                {history.slice(-5).map((m, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs bg-gray-50 dark:bg-gray-700/40 rounded-lg px-3 py-2">
                    <span className="font-mono font-bold text-gray-400 w-5">{history.length - 5 + i + 1}</span>
                    <div className={clsx("w-3 h-3 rounded-full shrink-0",
                      m.player === BLACK ? "bg-gradient-to-br from-gray-600 to-black" : "bg-gradient-to-br from-white to-gray-300 border border-gray-300"
                    )} />
                    <span className="font-mono font-medium">{getCoordLabel(m.row, m.col)}</span>
                    <span className="text-gray-400 ml-auto text-[10px]">
                      {new Date(m.timestamp).toLocaleTimeString('zh-CN', { minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                ))}
                {history.length === 0 && <p className="text-gray-400 text-center py-4 text-xs">暂无数据</p>}
              </div>
              <button
                onClick={() => setShowAnalysis(false)}
                className="mt-4 w-full py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
              >
                关闭
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
