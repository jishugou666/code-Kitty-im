import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { Zap, Brain, Search, Target, User } from 'lucide-react';
import { gameApi } from '../../../api/game';
import { generateOpponent, getDynamicDifficulty, getThinkingPhases, recordGameResult as recordDifficultyResult } from './dynamicDifficulty';
import type { Opponent, GameType } from './dynamicDifficulty';
import { useGameHeartbeat } from '../../../hooks/useGameHeartbeat';
import { useGameChannel } from '../../../hooks/useGameChannel';
import { useAuthStore } from '../../../store/authStore';
import { GameResultModal } from './GameResultModal';

interface GomokuBoardProps {
  matchId?: number;
  onGameOver?: (result: 'win' | 'loss' | 'draw') => void;
  mode?: 'ai' | 'pvp';
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
      'rounded-full z-10',
      isWin && 'animate-pulse'
    )}
    style={{
      width: '80%',
      height: '80%',
      flexShrink: 0,
      ...(player === BLACK
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
          })
    }}
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

/* CSS for board layout with SVG background - perfect alignment */
if (typeof document !== 'undefined') {
  const oldStyle = document.getElementById('gomoku-grid-styles');
  if (oldStyle) oldStyle.remove();
  const style = document.createElement('style');
  style.id = 'gomoku-grid-styles';
  style.textContent = `
    .gomoku-board-container { isolation: isolate; }
    .gomoku-cell-label {
      display: block;
      text-align: center;
      width: var(--gcs);
      height: var(--gcs);
      line-height: var(--gcs) !important;
      font-size: 10px !important;
    }
  `;
  document.head.appendChild(style);
}

export function GomokuBoard({
  matchId: _matchId,
  onGameOver,
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
  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [thinkingPhase, setThinkingPhase] = useState<string>('');
  const [showResultModal, setShowResultModal] = useState(false);
  const [performanceResult, setPerformanceResult] = useState<any>(null);
  const [myColor, setMyColor] = useState<'black' | 'white' | null>(null);
  const [pvpOpponent, setPvpOpponent] = useState<{ nickname: string; avatar: string | null } | null>(null);
  const [pvpLoaded, setPvpLoaded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const thinkTimeRef = useRef<number>(4000);

  const processMatchFinish = useCallback(async (won: boolean, defaultScore: number, defaultGrade: string, defaultTitle: string) => {
    if (!matchId) {
      setPerformanceResult({
        score: defaultScore, grade: defaultGrade, gradeLabel: defaultTitle,
        gradeColor: defaultGrade === 'S' ? '#FF6B6B' : defaultGrade === 'A' ? '#A855F7' : defaultGrade === 'B' ? '#3B82F6' : '#22C55E',
        bgGradient: 'from-blue-500 to-cyan-500',
        title: defaultTitle, ratingChange: won ? defaultScore * 0.4 : -defaultScore * 0.2,
        rawRatingChange: won ? Math.round(defaultScore * 0.4) : -Math.round(defaultScore * 0.2),
        difficultyCoeff: 0.85, strengthCoeff: 1.0,
        highlights: [], performanceBonuses: [], breakdown: {}
      });
      return;
    }
    try {
      const finishRes = await gameApi.finish(matchId, { won });
      if (finishRes.data?.performance_score !== undefined) {
        setPerformanceResult({
          score: finishRes.data.performance_score,
          grade: finishRes.data.performance_grade || defaultGrade,
          gradeLabel: finishRes.data.performance_title || defaultTitle,
          gradeColor: '#22C55E',
          bgGradient: 'from-green-500 to-emerald-500',
          title: finishRes.data.performance_title || defaultTitle,
          ratingChange: finishRes.data.score_change || (won ? 22 : -12),
          rawRatingChange: Math.round((finishRes.data.score_change || (won ? 22 : -12)) / 1),
          difficultyCoeff: 0.85,
          strengthCoeff: 1.0,
          highlights: finishRes.data.highlights || [],
          performanceBonuses: [],
          breakdown: finishRes.data.performance_details || {}
        });
      } else {
        setPerformanceResult({
          score: defaultScore, grade: defaultGrade, gradeLabel: defaultTitle,
          gradeColor: '#3B82F6', bgGradient: 'from-blue-500 to-cyan-500',
          title: defaultTitle, ratingChange: won ? 22 : -12,
          rawRatingChange: won ? 22 : -12,
          difficultyCoeff: 0.85, strengthCoeff: 1.0,
          highlights: [], performanceBonuses: [], breakdown: {}
        });
      }
    } catch {
      setPerformanceResult({
        score: defaultScore, grade: defaultGrade, gradeLabel: defaultTitle,
        gradeColor: '#3B82F6', bgGradient: 'from-blue-500 to-cyan-500',
        title: defaultTitle, ratingChange: won ? 22 : -12,
        rawRatingChange: won ? 22 : -12,
        difficultyCoeff: 0.85, strengthCoeff: 1.0,
        highlights: [], performanceBonuses: [], breakdown: {}
      });
    }
  }, [matchId]);

  useEffect(() => {
    if (mode === 'ai') {
      generateOpponent().then(setOpponent);
    }
  }, [mode]);

  useGameHeartbeat(matchId, gameStatus === 'playing');

  useGameChannel(matchId, {
    onRemoteMove: (data) => {
      const [row, col] = data.position;
      if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return;
      const symbol = data.symbol === 'B' || data.symbol === BLACK ? BLACK : WHITE;
      setBoard(prev => {
        const newBoard = prev.map(r => [...r]);
        newBoard[row][col] = symbol;
        const winCells = checkFive(row, col, symbol, newBoard);
        if (winCells.length > 0) {
          setTimeout(() => {
            setWinningCells(winCells);
            if (symbol === (myColor === 'black' ? BLACK : WHITE)) {
              setGameStatus('won');
              saveGameResult('win');
              recordDifficultyResult(true);
              processMatchFinish(true, 78, 'B', '连珠新星');
              setShowResultModal(true);
              onGameOver?.('win');
            } else {
              setGameStatus('lost');
              saveGameResult('loss');
              recordDifficultyResult(false);
              processMatchFinish(false, 32, 'D', '再接再厉');
              setShowResultModal(true);
              onGameOver?.('loss');
            }
          }, 0);
          return newBoard;
        }
        if (newBoard.every(r => r.every(c => c !== EMPTY))) {
          setTimeout(() => {
            setGameStatus('draw');
            saveGameResult('draw');
            recordDifficultyResult(false);
            processMatchFinish(false, 50, 'C', '势均力敌');
            setShowResultModal(true);
            onGameOver?.('draw');
          }, 0);
        }
        return newBoard;
      });
      setCurrentPlayer(symbol === BLACK ? WHITE : BLACK);
      setLastMove([row, col]);
      setHistory(h => [...h, { row, col, player: symbol, timestamp: Date.now() }]);
    },
    onRemoteSurrender: () => {
      if (gameStatus !== 'playing') return;
      setGameStatus('won');
      saveGameResult('win');
      recordDifficultyResult(true);
      processMatchFinish(true, 78, 'B', '对方认输');
      setShowResultModal(true);
      onGameOver?.('win');
    },
    onRemoteFinished: (data) => {
      if (gameStatus !== 'playing') return;
      const myId = useAuthStore.getState().user?.id;
      const iWon = data.winnerId === myId;
      if (iWon) {
        setGameStatus('won');
        saveGameResult('win');
        recordDifficultyResult(true);
        processMatchFinish(true, 78, 'B', '表现出色');
        setShowResultModal(true);
        onGameOver?.('win');
      } else if (data.status === 'finished' && data.winnerId) {
        setGameStatus('lost');
        saveGameResult('loss');
        recordDifficultyResult(false);
        processMatchFinish(false, 32, 'D', '继续加油');
        setShowResultModal(true);
        onGameOver?.('loss');
      } else {
        setGameStatus('draw');
        saveGameResult('draw');
        recordDifficultyResult(false);
        processMatchFinish(false, 50, 'C', '势均力敌');
        setShowResultModal(true);
        onGameOver?.('draw');
      }
    }
  });

  const initMatch = useCallback(async () => {
    try {
      if (mode === 'pvp' && _matchId) {
        setMatchId(_matchId);
        const res = await gameApi.getMatch(_matchId);
        if (res.code === 200 && res.data) {
          const m = res.data;
          const myId = useAuthStore.getState().user?.id;
          setMyColor(Number(m.player1_id) === myId ? 'black' : 'white');
          const oppId = Number(m.player1_id) === myId ? m.player2_id : m.player1_id;
          const oppName = Number(m.player1_id) === myId
            ? (m.player2_name || '对方')
            : (m.player1_name || '对方');
          const oppAvatar = Number(m.player1_id) === myId
            ? (m.player2_avatar || null)
            : (m.player1_avatar || null);
          setPvpOpponent({ nickname: oppName, avatar: oppAvatar });
          if (m.moves && Array.isArray(m.moves)) {
            try {
              const parsed = typeof m.moves === 'string' ? JSON.parse(m.moves) : m.moves;
              if (parsed.length > 0) {
                const rebuiltBoard = createEmptyBoard();
                const rebuiltHistory: MoveRecord[] = [];
                let currentTurn = BLACK;
                for (const mv of parsed) {
                  const row = mv.position[0] || 0;
                  const col = mv.position[1] || 0;
                  if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
                    const symbol = mv.symbol === 'B' || mv.symbol === BLACK ? BLACK : WHITE;
                    rebuiltBoard[row][col] = symbol;
                    rebuiltHistory.push({ row, col, player: symbol, timestamp: Date.now() });
                    currentTurn = symbol === BLACK ? WHITE : BLACK;
                  }
                }
                setBoard(rebuiltBoard);
                setHistory(rebuiltHistory);
                setCurrentPlayer(currentTurn);
                if (rebuiltHistory.length > 0) {
                  const lastMoveRecord = rebuiltHistory[rebuiltHistory.length - 1];
                  setLastMove([lastMoveRecord.row, lastMoveRecord.col]);
                }
              }
            } catch {}
          }
        }
        setPvpLoaded(true);
        return;
      }
      const res = await gameApi.createMatch({
        gameType: 'gomoku',
        mode: 'ai',
      });
      if (res.code === 200 && res.data) {
        setMatchId(res.data.id);
      }
    } catch (e) {
      console.log('[Gomoku] 创建对局失败，离线模式');
    }
  }, [mode, _matchId]);

  useEffect(() => {
    initMatch();
  }, [initMatch]);

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
    if (!isAIThinking || gameStatus !== 'playing' || mode === 'pvp') return;
    const tt = thinkTimeRef.current;
    const phases = getThinkingPhases(tt);
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
      setAiThinkProgress(progress);
      if (phaseIndex < phases.length - 1 && progress >= phases[phaseIndex + 1].progress) {
        phaseIndex++;
        setThinkingPhase(phaseLabels[phases[phaseIndex]?.phase] || '');
      }
    }, tt / 10);
    const timer = setTimeout(() => {
      clearInterval(interval);
      setAiThinkProgress(100);
      const currentBoard = board.map(r => [...r]);
      const [aiRow, aiCol] = getAIPosition(currentBoard, 'medium', history.filter(h => h.player === WHITE).length);
      const newBoard = board.map(r => [...r]);
      newBoard[aiRow][aiCol] = WHITE;
      setBoard(newBoard);
      setCurrentPlayer(BLACK);
      setLastMove([aiRow, aiCol]);
      setHistory(h => [...h, { row: aiRow, col: aiCol, player: WHITE, timestamp: Date.now() }]);
      setIsAIThinking(false);
      setAiThinkProgress(0);
      setThinkingPhase('');
      if (matchId) {
        gameApi.move(matchId, { position: [aiRow, aiCol], symbol: 'W' }).catch(() => {});
      }
      const winCells = checkFive(aiRow, aiCol, WHITE, newBoard);
      if (winCells.length > 0) {
        setWinningCells(winCells);
        setGameStatus('lost');
        saveGameResult('loss');
        recordDifficultyResult(false);

        processMatchFinish(false, 32, 'D', '再接再厉');
        setShowResultModal(true);

        onGameOver?.('loss');
        return;
      }
      if (newBoard.every(r => r.every(c => c !== EMPTY))) {
        setGameStatus('draw');
        saveGameResult('draw');
        recordDifficultyResult(false);

        processMatchFinish(false, 50, 'C', '势均力敌');
        setShowResultModal(true);

        onGameOver?.('draw');
      }
    }, tt);
    return () => { clearTimeout(timer); clearInterval(interval); setAiThinkProgress(0); setThinkingPhase(''); };
  }, [isAIThinking, gameStatus, board, onGameOver, history, matchId, mode]);

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
    if (board[row][col] !== EMPTY || gameStatus !== 'playing' || isAIThinking) return;
    const isMyTurn = mode === 'pvp'
      ? (myColor ? currentPlayer === (myColor === 'black' ? BLACK : WHITE) : true)
      : currentPlayer === BLACK;
    if (!isMyTurn) return;
    const currentSymbol = currentPlayer;

    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = currentSymbol;
    setBoard(newBoard);
    setCurrentPlayer(currentSymbol === BLACK ? WHITE : BLACK);
    setLastMove([row, col]);
    setHistory(h => [...h, { row, col, player: currentSymbol, timestamp: Date.now() }]);
    setPreviewStep(null);
    setPreviewBoard(null);
    if (matchId) {
      gameApi.move(matchId, { position: [row, col], symbol: currentSymbol === BLACK ? 'B' : 'W' }).catch(() => {});
    }
    const winCells = checkFive(row, col, currentSymbol, newBoard);
    if (winCells.length > 0) {
      setWinningCells(winCells);
      if (currentSymbol === BLACK) {
        setGameStatus('won');
        saveGameResult('win');
        recordDifficultyResult(true);

        processMatchFinish(true, 78, 'B', '连珠新星');
        setShowResultModal(true);

        onGameOver?.('win');
      } else {
        setGameStatus('lost');
        saveGameResult('loss');
        recordDifficultyResult(false);

        processMatchFinish(false, 32, 'D', '再接再厉');
        setShowResultModal(true);

        onGameOver?.('loss');
      }
      return;
    }
    if (newBoard.every(r => r.every(c => c !== EMPTY))) {
      setGameStatus('draw');
      saveGameResult('draw');
      recordDifficultyResult(false);

      processMatchFinish(false, 50, 'C', '势均力敌');
      setShowResultModal(true);

      onGameOver?.('draw');
      return;
    }
    if (mode === 'ai') {
      setIsAIThinking(true);
      thinkTimeRef.current = getDynamicDifficulty('gomoku' as GameType, history.length).thinkTime;
    }
  }, [board, gameStatus, currentPlayer, isAIThinking, onGameOver, matchId, mode, myColor]);

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
          gameType: 'gomoku',
          mode: 'ai',
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
      saveGameResult('loss');
      recordDifficultyResult(false);
      setPerformanceResult({
        score: 30,
        grade: 'D',
        gradeLabel: '认输',
        gradeColor: '#9CA3AF',
        bgGradient: 'from-gray-400 to-gray-300',
        title: '认输',
        ratingChange: -12,
        rawRatingChange: -12,
        difficultyCoeff: 0.85,
        strengthCoeff: 1.0,
        highlights: [],
        performanceBonuses: [],
        breakdown: {}
      });
      setShowResultModal(true);
      onGameOver?.('loss');
    }
  };

  const saveGameResult = (result: 'win' | 'loss' | 'draw') => {
    try {
      const key = 'gomoku_stats';
      const raw = localStorage.getItem(key);
      const data = raw ? JSON.parse(raw) : { wins: 0, losses: 0, draws: 0, games: 0 };
      if (result === 'win') data.wins++;
      else if (result === 'loss') data.losses++;
      else data.draws++;
      data.games++;
      localStorage.setItem(key, JSON.stringify(data));
    } catch {}
  };

  const statusText = gameStatus !== 'playing' ? '' : isAIThinking
    ? `\u26AA ${opponent?.nickname || '对手'} ${thinkingPhase ? thinkingPhase + '...' : '思考中'} (白方)`
    : mode === 'pvp'
      ? `${currentPlayer === BLACK ? '\u26AB' : '\u26AA'} ${currentPlayer === BLACK ? '黑方' : '白方'}的回合${!pvpLoaded ? ' (连接中...)' : ''}`
      : '\u26AB 你的回合 (黑方)';

  const displayOpponent = mode === 'pvp' && pvpOpponent
    ? { nickname: pvpOpponent.nickname, avatar: pvpOpponent.avatar || '', rankLabel: 'PVP对手', rating: 0 }
    : opponent;
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
      {/* 新的表现分结算弹窗 */}
      <GameResultModal
        open={showResultModal}
        result={gameStatus === 'won' ? 'win' : gameStatus === 'lost' ? 'loss' : 'draw'}
        gameType="gomoku"
        performanceData={performanceResult}
        gameStats={{
          moveCount: stats.totalMoves,
          durationSeconds: timerSeconds,
          winRate: storedStats.games > 0 ? `${Math.round(storedStats.wins / storedStats.games * 100)}%` : '0%',
          totalWins: storedStats.wins,
          totalGames: storedStats.games
        }}
        onRestart={() => {
          setShowResultModal(false);
          resetBoard();
        }}
        onClose={() => setShowResultModal(false)}
      />

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
                      className="w-1.5 h-1.5 rounded-full bg-amber-500"
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
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
                  initial={{ width: '0%' }}
                  animate={{ width: `${aiThinkProgress}%` }}
                  transition={{ ease: 'linear', duration: thinkTimeRef.current / 800 }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Board Container with Coordinates */}
        <div className="relative overflow-hidden rounded-2xl shadow-xl" style={{
          background: 'linear-gradient(145deg, #DEB887 0%, #D2A679 20%, #C9956A 50%, #BF8E5F 75%, #B58555 100%)',
          padding: '16px'
        }}>
          {/* Wood grain noise overlay */}
          <div className="absolute inset-0 opacity-[0.07] pointer-events-none rounded-2xl"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundSize: '180px 180px'
            }} />

          {/* Column Labels */}
          <div className="flex mb-1" style={{ marginLeft: 'calc(var(--gcs) / 2)' }}>
            {COL_LABELS.split('').map(label => (
              <span key={label} className="font-mono text-[10px] font-bold text-amber-900/50 dark:text-amber-200/50 select-none text-center"
                style={{ width: 'var(--gcs)' }}>{label}</span>
            ))}
          </div>

          {/* Main board area: row labels + grid */}
          <div className="flex">
            {/* Row Labels */}
            <div className="flex flex-col" style={{ paddingRight: '4px' }}>
              {Array.from({ length: BOARD_SIZE }).map((_, i) => (
                <span key={i} className="font-mono text-[10px] font-bold text-amber-900/50 dark:text-amber-200/50 select-none"
                  style={{
                    height: 'var(--gcs)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingRight: '4px'
                  }}>{i + 1}</span>
              ))}
            </div>

            {/* Perfect Alignment Board - SVG Background + Absolute Clickable Cells */}
            <div
              className="gomoku-board-container relative"
              style={{
                '--gcs': 'min(28px, calc((100vw - 220px) / 15))',
                width: 'calc(var(--gcs) * 14 + 1px)',
                height: 'calc(var(--gcs) * 14 + 1px)',
                position: 'relative'
              } as React.CSSProperties}
            >
              {/* SVG Background - perfect lines and stars */}
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 211 211"
                preserveAspectRatio="xMidYMid meet"
                className="absolute top-0 left-0 pointer-events-none"
                style={{ zIndex: 1 }}
              >
                {/* Grid lines */}
                {Array.from({ length: 15 }).map((_, i) => (
                  <React.Fragment key={`g-${i}`}>
                    <line
                      x1={i * 15 + 0.5} y1={0.5}
                      x2={i * 15 + 0.5} y2={210.5}
                      stroke="#5D3A1A"
                      strokeWidth={0.7}
                    />
                    <line
                      x1={0.5} y1={i * 15 + 0.5}
                      x2={210.5} y2={i * 15 + 0.5}
                      stroke="#5D3A1A"
                      strokeWidth={0.7}
                    />
                  </React.Fragment>
                ))}
                {/* Star points */}
                {STAR_POINTS.map(([r, c]) => (
                  <circle
                    key={`s-${r}-${c}`}
                    cx={c * 15 + 0.5}
                    cy={r * 15 + 0.5}
                    r={3.2}
                    fill="#5D3A1A"
                    opacity={0.65}
                  />
                ))}
                {/* Outer border - two lines */}
                <rect x={-2} y={-2} width={215} height={215} fill="none" stroke="#5D3A1A" strokeWidth={2.5} />
                <rect x={4} y={4} width={203} height={203} fill="none" stroke="#5D3A1A" strokeWidth={1} />
              </svg>

              {/* Clickable cells absolute positions */}
              {displayBoard.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  const isWinCell = winningCells?.some(([wr, wc]) => wr === rowIndex && wc === colIndex) ?? false;
                  const isLast = lastMove?.[0] === rowIndex && lastMove?.[1] === colIndex && !previewBoard;
                  const isHover = hoverPos?.[0] === rowIndex && hoverPos?.[1] === colIndex
                    && cell === EMPTY && gameStatus === 'playing' && !isAIThinking
                    && (mode === 'pvp' || currentPlayer === BLACK);

                  return (
                    <button
                      key={`${rowIndex}-${colIndex}`}
                      onClick={() => handleClick(rowIndex, colIndex)}
                      onMouseEnter={() => setHoverPos([rowIndex, colIndex])}
                      onMouseLeave={() => setHoverPos(null)}
                      disabled={cell !== EMPTY || gameStatus !== 'playing' || isAIThinking}
                      className={clsx(
                        'absolute cursor-pointer outline-none',
                        cell === EMPTY && gameStatus === 'playing' && !isAIThinking && (mode === 'pvp' || currentPlayer === BLACK)
                          ? 'hover:bg-amber-400/15 active:bg-amber-400/25'
                          : ''
                      )}
                      style={{
                        width: 'var(--gcs)',
                        height: 'var(--gcs)',
                        left: `calc(var(--gcs) * ${colIndex} - var(--gcs)/2)`,
                        top: `calc(var(--gcs) * ${rowIndex} - var(--gcs)/2)`,
                        zIndex: isWinCell ? 15 : 5,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {/* Ghost piece on hover */}
                      {isHover && (
                        <motion.div
                          initial={{ scale: 0.7, opacity: 0 }}
                          animate={{ scale: 0.8, opacity: 0.45 }}
                          exit={{ scale: 0.7, opacity: 0 }}
                          className="absolute rounded-full z-[6]"
                          style={{
                            width: '75%',
                            height: '75%',
                            background: 'radial-gradient(circle at 35% 30%, #888, #333 70%, #111)',
                            boxShadow: '1px 3px 6px rgba(0,0,0,0.35)',
                            border: '1px solid rgba(0,0,0,0.1)',
                            opacity: 0.35
                          }}
                        />
                      )}

                      {/* Stone piece */}
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

        {/* 对局信息 */}
        <div className="text-xs px-3 py-1.5 rounded-lg font-medium text-indigo-600 bg-indigo-500/10 dark:text-indigo-400 dark:bg-indigo-500/20">
          在线对局 · 思考 {thinkTimeRef.current}ms
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
        {/* Opponent Info Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/60 dark:border-gray-700/50 p-4 shadow-sm">
          {displayOpponent ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                {mode === 'pvp' && pvpOpponent?.avatar ? (
                  <img src={pvpOpponent.avatar} alt={pvpOpponent.nickname} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 object-cover" />
                ) : (
                  <img
                    src={displayOpponent.avatar}
                    alt={displayOpponent.nickname}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{displayOpponent.nickname}</p>
                  <p className="text-xs text-gray-500">{mode === 'pvp' ? `PVP对战 · 你执${myColor === 'black' ? '黑' : '白'}` : `${displayOpponent.rankLabel} · ${displayOpponent.rating}分`}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {mode === 'pvp' ? (
                  <>
                    <span className={`px-2 py-0.5 rounded-full ${pvpLoaded ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400'}`}>
                      {pvpLoaded ? '已连接' : '连接中...'}
                    </span>
                    <span className="flex items-center gap-1"><User size={12} />{myColor === 'black' ? '先手' : '后手'}</span>
                  </>
                ) : (
                  <>
                    <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full">实时匹配</span>
                    <span className="px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full">在线</span>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-400">匹配对手中...</p>
              </div>
            </div>
          )}
        </div>

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
              <span className="text-blue-600 dark:text-blue-400 font-medium">进攻力 (白方)</span>
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
        {gameStatus !== 'playing' && !showResultModal && (
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
                    {stats.totalMoves > 0 ? Math.round(thinkTimeRef.current / 1000) + 's' : '-'}
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
