import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { Target, HelpCircle, Trophy, Clock, RotateCcw, History, Share2, User, CircleDot } from 'lucide-react';
import { gameApi } from '../../../api/game';
import { generateOpponent, getDynamicDifficulty, getThinkingPhases, recordGameResult as recordDifficultyResult } from './dynamicDifficulty';
import type { Opponent, GameType } from './dynamicDifficulty';
import { useGameHeartbeat } from '../../../hooks/useGameHeartbeat';
import { useGameChannel } from '../../../hooks/useGameChannel';
import { useAuthStore } from '../../../store/authStore';
import { GameResultModal } from './GameResultModal';
import { getAvatarUrl } from '../../../lib/avatarCache';
import { ImageWithLazyLoad } from '../ui/ImageWithLazyLoad';

interface GoBoardProps {
  mode?: 'ai' | 'pvp';
  matchId?: number;
  onGameOver?: (result: 'win' | 'loss' | 'draw') => void;
}

type Stone = 0 | 1 | 2;
type GoBoard = Stone[][];
type GameStatus = 'idle' | 'playing' | 'won' | 'lost' | 'draw';

const BOARD_SIZE = 9;
const EMPTY: Stone = 0;
const BLACK: Stone = 1;
const WHITE: Stone = 2;

const STAR_POINTS: [number, number][] = [
  [2, 2], [2, 6],
  [4, 4],
  [6, 2], [6, 6]
];

const OPPONENT_THINKING_LABELS = {
  analyzing: '分析棋局',
  evaluating: '评估领地',
  deciding: '决策落子',
  ready: '即将落子'
};

function createEmptyBoard(): GoBoard {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(EMPTY));
}

function copyBoard(board: GoBoard): GoBoard {
  return board.map(row => [...row]);
}

function getNeighbors(row: number, col: number): [number, number][] {
  const neighbors: [number, number][] = [];
  if (row > 0) neighbors.push([row - 1, col]);
  if (row < BOARD_SIZE - 1) neighbors.push([row + 1, col]);
  if (col > 0) neighbors.push([row, col - 1]);
  if (col < BOARD_SIZE - 1) neighbors.push([row, col + 1]);
  return neighbors;
}

function getGroup(board: GoBoard, row: number, col: number): Set<string> {
  const color = board[row][col];
  if (color === EMPTY) return new Set();
  const group = new Set<string>();
  const stack: [number, number][] = [[row, col]];
  const visited = new Set<string>();
  while (stack.length > 0) {
    const [r, c] = stack.pop()!;
    const key = `${r},${c}`;
    if (visited.has(key)) continue;
    visited.add(key);
    if (board[r][c] !== color) continue;
    group.add(key);
    for (const [nr, nc] of getNeighbors(r, c)) {
      if (!visited.has(`${nr},${nc}`)) stack.push([nr, nc]);
    }
  }
  return group;
}

function getLiberties(board: GoBoard, group: Set<string>): number {
  const liberties = new Set<string>();
  for (const key of group) {
    const [r, c] = key.split(',').map(Number);
    for (const [nr, nc] of getNeighbors(r, c)) {
      if (board[nr][nc] === EMPTY) liberties.add(`${nr},${nc}`);
    }
  }
  return liberties.size;
}

function placeStone(
  board: GoBoard,
  row: number,
  col: number,
  color: Stone
): { newBoard: GoBoard; captured: [number, number][] } {
  const newBoard = copyBoard(board);
  newBoard[row][col] = color;
  const opponent = color === BLACK ? WHITE : BLACK;
  const captured: [number, number][] = [];
  const checked = new Set<string>();
  for (const [nr, nc] of getNeighbors(row, col)) {
    const key = `${nr},${nc}`;
    if (checked.has(key) || newBoard[nr][nc] !== opponent) continue;
    checked.add(key);
    const group = getGroup(newBoard, nr, nc);
    if (getLiberties(newBoard, group) === 0) {
      for (const gkey of group) {
        const [gr, gc] = gkey.split(',').map(Number);
        captured.push([gr, gc]);
        newBoard[gr][gc] = EMPTY;
      }
    }
  }
  return { newBoard, captured };
}

function isValidMove(board: GoBoard, row: number, col: number, color: Stone, koPoint: [number, number] | null): boolean {
  if (board[row][col] !== EMPTY) return false;
  if (koPoint && koPoint[0] === row && koPoint[1] === col) return false;
  const { newBoard, captured } = placeStone(board, row, col, color);
  const myGroup = getGroup(newBoard, row, col);
  if (getLiberties(newBoard, myGroup) === 0 && captured.length === 0) return false;
  return true;
}

function calculateScore(board: GoBoard): { black: number; white: number } {
  let blackStones = 0;
  let whiteStones = 0;
  const territoryBlack = new Set<string>();
  const territoryWhite = new Set<string>();
  const visited = new Set<string>();
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === BLACK) blackStones++;
      else if (board[r][c] === WHITE) whiteStones++;
      else if (!visited.has(`${r},${c}`)) {
        const region = new Set<string>();
        let touchesBlack = false;
        let touchesWhite = false;
        const stack: [number, number][] = [[r, c]];
        while (stack.length > 0) {
          const [cr, cc] = stack.pop()!;
          const key = `${cr},${cc}`;
          if (visited.has(key) || region.has(key)) continue;
          if (board[cr][cc] === BLACK) { touchesBlack = true; continue; }
          if (board[cr][cc] === WHITE) { touchesWhite = true; continue; }
          region.add(key);
          visited.add(key);
          for (const [nr, nc] of getNeighbors(cr, cc)) stack.push([nr, nc]);
        }
        if (touchesBlack && !touchesWhite) for (const k of region) territoryBlack.add(k);
        else if (touchesWhite && !touchesBlack) for (const k of region) territoryWhite.add(k);
      }
    }
  }
  return {
    black: blackStones + territoryBlack.size + 7.5,
    white: whiteStones + territoryWhite.size
  };
}

function getAllValidMoves(board: GoBoard, color: Stone, koPoint: [number, number] | null): [number, number][] {
  const moves: [number, number][] = [];
  for (let r = 0; r < BOARD_SIZE; r++)
    for (let c = 0; c < BOARD_SIZE; c++)
      if (isValidMove(board, r, c, color, koPoint)) moves.push([r, c]);
  return moves;
}

function evaluatePosition(board: GoBoard, color: Stone): number {
  let score = 0;
  const opp = color === BLACK ? WHITE : BLACK;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === color) {
        score += 10;
        const centerDist = Math.abs(r - 4) + Math.abs(c - 4);
        score += Math.max(0, 8 - centerDist);
      } else if (board[r][c] === opp) {
        score -= 10;
      }
    }
  }
  const corners = [[1, 1], [1, 7], [7, 1], [7, 7]];
  for (const [cr, cc] of corners) {
    if (board[cr][cc] === color) score += 15;
    else if (board[cr][cc] === opp) score -= 15;
  }
  const edges3 = [[0, 4], [4, 0], [4, 8], [8, 4]];
  for (const [er, ec] of edges3) {
    if (board[er][ec] === color) score += 8;
    else if (board[er][ec] === opp) score -= 8;
  }
  if (board[4][4] === color) score += 12;
  else if (board[4][4] === opp) score -= 12;
  return score;
}

function countCaptures(board: GoBoard, row: number, col: number, color: Stone): number {
  const { captured } = placeStone(board, row, col, color);
  return captured.length;
}

function hasAtariThreat(board: GoBoard, row: number, col: number, color: Stone): boolean {
  const { newBoard } = placeStone(board, row, col, color);
  const opp = color === BLACK ? WHITE : BLACK;
  for (const [nr, nc] of getNeighbors(row, col)) {
    if (newBoard[nr][nc] === opp) {
      const group = getGroup(newBoard, nr, nc);
      if (getLiberties(newBoard, group) === 1) return true;
    }
  }
  return false;
}

function defendAtari(board: GoBoard, color: Stone): [number, number] | null {
  const opp = color === BLACK ? WHITE : BLACK;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === color) {
        const group = getGroup(board, r, c);
        if (getLiberties(board, group) <= 2) {
          for (const key of group) {
            const [gr, gc] = key.split(',').map(Number);
            for (const [nr, nc] of getNeighbors(gr, gc)) {
              if (board[nr][nc] === EMPTY && isValidMove(board, nr, nc, color, null)) {
                const { newBoard } = placeStone(board, nr, nc, color);
                const newGroup = getGroup(newBoard, gr, gc);
                if (getLiberties(newBoard, newGroup) > 2) return [nr, nc];
              }
            }
          }
        }
      }
    }
  }
  return null;
}

function findCaptureMove(board: GoBoard, color: Stone, koPoint: [number, number] | null): [number, number] | null {
  const moves = getAllValidMoves(board, color, koPoint);
  let bestCapture: [number, number] | null = null;
  let maxCaptures = 0;
  for (const [r, c] of moves) {
    const caps = countCaptures(board, r, c, color);
    if (caps > maxCaptures) {
      maxCaptures = caps;
      bestCapture = [r, c];
    }
  }
  return bestCapture;
}

function getAIMove(
  board: GoBoard,
  difficulty: 'easy' | 'medium' | 'hard',
  color: Stone,
  koPoint: [number, number] | null,
  moveCount: number
): [number, number] | null {
  const validMoves = getAllValidMoves(board, color, koPoint);
  if (validMoves.length === 0) return null;

  if (difficulty === 'easy') {
    if (Math.random() < 0.25 && moveCount < 15) {
      const corners = [[2, 2], [2, 6], [6, 2], [6, 6], [4, 4]].filter(([r, c]) =>
        board[r][c] === EMPTY
      );
      if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)] as [number, number];
    }
    if (Math.random() < 0.18) {
      return validMoves[Math.floor(Math.random() * validMoves.length)];
    }
    const scored = validMoves.map(([r, c]) => ({
      move: [r, c] as [number, number],
      score: evaluatePosition(placeStone(board, r, c, color).newBoard, color)
        + (countCaptures(board, r, c, color) * 20)
        + (hasAtariThreat(board, r, c, color) ? 10 : 0)
    }));
    scored.sort((a, b) => b.score - a.score);
    const topMoves = scored.slice(0, Math.max(3, Math.floor(scored.length / 2)));
    return topMoves[Math.floor(Math.random() * topMoves.length)].move;
  }

  if (difficulty === 'medium') {
    const captureMove = findCaptureMove(board, color, koPoint);
    if (captureMove && countCaptures(board, captureMove[0], captureMove[1], color) >= 1) {
      return captureMove;
    }
    const defense = defendAtari(board, color);
    if (defense) return defense;
    const scored = validMoves.map(([r, c]) => {
      const { newBoard, captured } = placeStone(board, r, c, color);
      let s = evaluatePosition(newBoard, color);
      s += captured.length * 25;
      if (hasAtariThreat(board, r, c, color)) s += 15;
      const cornerDist = Math.min(r, BOARD_SIZE - 1 - r) + Math.min(c, BOARD_SIZE - 1 - c);
      if (moveCount < 20) s += Math.max(0, 6 - cornerDist) * 2;
      return { move: [r, c] as [number, number], score: s };
    });
    scored.sort((a, b) => b.score - a.score);
    const topN = scored.slice(0, Math.min(3, scored.length));
    if (topN.length > 1 && Math.random() < 0.12 && scored.length > 3) {
      return scored[Math.floor(Math.random() * 3) + 2]?.move ?? topN[0].move;
    }
    return topN[Math.floor(Math.random() * topN.length)].move;
  }

  const captureMove = findCaptureMove(board, color, koPoint);
  if (captureMove) return captureMove;

  const defense = defendAtari(board, color);
  if (defense) return defense;

  const opp = color === BLACK ? WHITE : BLACK;
  const oppCapture = findCaptureMove(board, opp, null);
  if (oppCapture) {
    const blockMoves: [number, number][] = [];
    for (const [nr, nc] of getNeighbors(oppCapture[0], oppCapture[1])) {
      if (isValidMove(board, nr, nc, color, koPoint)) blockMoves.push([nr, nc]);
    }
    if (blockMoves.length > 0) return blockMoves[Math.floor(Math.random() * blockMoves.length)];
  }

  const scored = validMoves.map(([r, c]) => {
    const { newBoard, captured } = placeStone(board, r, c, color);
    let s = evaluatePosition(newBoard, color);
    s += captured.length * 30;
    if (hasAtariThreat(board, r, c, color)) s += 20;

    const myGroupAfter = getGroup(newBoard, r, c);
    const libsAfter = getLiberties(newBoard, myGroupAfter);
    s += libsAfter * 3;

    const cornerDist = Math.min(r, BOARD_SIZE - 1 - r) + Math.min(c, BOARD_SIZE - 1 - c);
    if (moveCount < 16) s += Math.max(0, 7 - cornerDist) * 3;
    else if (moveCount < 30) s += Math.max(0, 5 - cornerDist);

    const edgeBonus =
      (r === 0 || r === BOARD_SIZE - 1 ? 1 : 0) +
      (c === 0 || c === BOARD_SIZE - 1 ? 1 : 0);
    if (edgeBonus >= 1 && moveCount < 10) s -= 5;

    const centerDist = Math.abs(r - 4) + Math.abs(c - 4);
    s += Math.max(0, 8 - centerDist) * (moveCount < 25 ? 1.5 : 0.5);

    for (const [sr, sc] of STAR_POINTS) {
      if (r === sr && c === sc && board[r][c] === EMPTY) s += 8;
    }

    return { move: [r, c] as [number, number], score: s };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].move;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function getStatsFromStorage(): { wins: number; losses: number; draws: number } {
  try {
    const raw = localStorage.getItem('go_stats');
    if (raw) return JSON.parse(raw);
  } catch {}
  return { wins: 0, losses: 0, draws: 0 };
}

function saveStatsToStorage(stats: { wins: number; losses: number; draws: number }) {
  try {
    localStorage.setItem('go_stats', JSON.stringify(stats));
  } catch {}
}

export const GoBoard = React.memo(function GoBoard({
  matchId: _matchId,
  onGameOver,
  mode = 'ai'
}: GoBoardProps) {
  const [board, setBoard] = useState<GoBoard>(() => createEmptyBoard());
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [stats, setStats] = useState(() => getStatsFromStorage());
  const [scoreChange, setScoreChange] = useState<string>('');
  const [showResultModal, setShowResultModal] = useState(false);
  const [performanceResult, setPerformanceResult] = useState<any>(null);
  const [myColor, setMyColor] = useState<'black' | 'white' | null>(mode === 'ai' ? 'black' : null);
  const [pvpOpponent, setPvpOpponent] = useState<{ nickname: string; avatar: string | null } | null>(null);
  const [pvpLoaded, setPvpLoaded] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState<Stone>(BLACK);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [thinkingPhase, setThinkingPhase] = useState<string>('');
  const [lastMove, setLastMove] = useState<[number, number] | null>(null);
  const [koPoint, setKoPoint] = useState<[number, number] | null>(null);
  const [moveCount, setMoveCount] = useState(0);
  const [passCount, setPassCount] = useState(0);
  const [blackCaptures, setBlackCaptures] = useState(0);
  const [whiteCaptures, setWhiteCaptures] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showReplay, setShowReplay] = useState(false);
  const [history, setHistory] = useState<{ board: GoBoard; player: Stone; lastMove: [number, number] | null; ko: [number, number] | null }[]>([]);
  const [boardShake, setBoardShake] = useState(false);
  const [boardGlow, setBoardGlow] = useState(false);
  const [flashCell, setFlashCell] = useState<[number, number] | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [showDifficultyTip, setShowDifficultyTip] = useState(false);
  const [aiThinkProgress, setAiThinkProgress] = useState(0);
  const [matchId, setMatchId] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initializingRef = useRef(false);
  const thinkTimeRef = useRef<number>(5000);

  const processMatchFinish = useCallback(async (won: boolean, defaultScore: number, defaultGrade: string, defaultTitle: string) => {
    if (!matchId) {
      setPerformanceResult({
        score: defaultScore, grade: defaultGrade, gradeLabel: defaultTitle,
        gradeColor: defaultGrade === 'S' ? '#FF6B6B' : defaultGrade === 'A' ? '#A855F7' : defaultGrade === 'B' ? '#3B82F6' : '#22C55E',
        bgGradient: 'from-blue-500 to-cyan-500',
        title: defaultTitle, ratingChange: won ? defaultScore : -defaultScore,
        rawRatingChange: won ? defaultScore : -defaultScore,
        difficultyCoeff: 1.2, strengthCoeff: 1.0,
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
          ratingChange: finishRes.data.score_change || (won ? 30 : -15),
          rawRatingChange: Math.round((finishRes.data.score_change || (won ? 30 : -15)) / 1),
          difficultyCoeff: 1.2, strengthCoeff: 1.0,
          highlights: finishRes.data.highlights || [],
          performanceBonuses: [],
          breakdown: finishRes.data.performance_details || {}
        });
      } else {
        setPerformanceResult({
          score: defaultScore, grade: defaultGrade, gradeLabel: defaultTitle,
          gradeColor: '#3B82F6', bgGradient: 'from-blue-500 to-cyan-500',
          title: defaultTitle, ratingChange: won ? defaultScore : -defaultScore,
          rawRatingChange: won ? defaultScore : -defaultScore,
          difficultyCoeff: 1.2, strengthCoeff: 1.0,
          highlights: [], performanceBonuses: [], breakdown: {}
        });
      }
    } catch {
      setPerformanceResult({
        score: defaultScore, grade: defaultGrade, gradeLabel: defaultTitle,
        gradeColor: '#3B82F6', bgGradient: 'from-blue-500 to-cyan-500',
        title: defaultTitle, ratingChange: won ? defaultScore : -defaultScore,
        rawRatingChange: won ? defaultScore : -defaultScore,
        difficultyCoeff: 1.2, strengthCoeff: 1.0,
        highlights: [], performanceBonuses: [], breakdown: {}
      });
    }
  }, [matchId]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (gameStatus === 'playing') setElapsedTime(t => t + 1);
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameStatus]);

  useEffect(() => {
    if (mode === 'ai') {
      generateOpponent().then(setOpponent);
      setMyColor('black');
    }
  }, [mode]);

  useGameHeartbeat(matchId, gameStatus === 'playing');

  useGameChannel(matchId, {
    onRemoteMove: (data) => {
      const row = data.position?.[0] ?? 0;
      const col = data.position?.[1] ?? 0;
      if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return;
      const remoteColor = data.color === 'white' ? WHITE : BLACK;
      setBoard(prev => {
        const { newBoard, captured } = placeStone(prev, row, col, remoteColor);
        if (remoteColor === BLACK) setBlackCaptures(bc => bc + captured.length);
        else setWhiteCaptures(wc => wc + captured.length);
        if (captured.length === 1) setKoPoint(captured[0]);
        else setKoPoint(null);
        return newBoard;
      });
      setCurrentPlayer(prev => prev === BLACK ? WHITE : BLACK);
      setLastMove([row, col]);
      setMoveCount(c => c + 1);
      setPassCount(0);
      setFlashCell([row, col]);
      setTimeout(() => setFlashCell(null), 300);
    },
    onRemoteSurrender: () => {
      if (gameStatus !== 'playing') return;
      setGameStatus('won');
      setBoardGlow(true);
      setTimeout(() => setBoardGlow(false), 1500);
      const newStats = { ...stats, wins: stats.wins + 1 };
      setStats(newStats);
      saveStatsToStorage(newStats);
      const winScore = 10 + Math.floor(Math.random() * 3);
      setScoreChange(`+${winScore}`);
      setPerformanceResult({
        score: winScore, grade: 'B', gradeLabel: '对方认输',
        gradeColor: '#3B82F6', bgGradient: 'from-blue-500 to-cyan-500',
        title: '对方认输', ratingChange: winScore,
        rawRatingChange: winScore,
        difficultyCoeff: 0.4, strengthCoeff: 1.0,
        highlights: [], performanceBonuses: [], breakdown: {}
      });
      processMatchFinish(true, winScore, 'B', '对方认输');
      setShowResultModal(true);
    },
    onRemoteFinished: (data) => {
      if (gameStatus !== 'playing') return;
      const myId = useAuthStore.getState().user?.id;
      const iWon = data.winnerId === myId;
      if (iWon) {
        setGameStatus('won');
        setBoardGlow(true);
        setTimeout(() => setBoardGlow(false), 1500);
        const newStats = { ...stats, wins: stats.wins + 1 };
        setStats(newStats); saveStatsToStorage(newStats);
        const winScore = 10 + Math.floor(Math.random() * 3);
        setScoreChange(`+${winScore}`);
        setPerformanceResult({
          score: winScore, grade: 'B', gradeLabel: '表现出色',
          gradeColor: '#3B82F6', bgGradient: 'from-blue-500 to-cyan-500',
          title: '表现出色', ratingChange: winScore,
          rawRatingChange: winScore,
          difficultyCoeff: 0.4, strengthCoeff: 1.0,
          highlights: [], performanceBonuses: [], breakdown: {}
        });
        processMatchFinish(true, winScore, 'B', '表现出色');
        setShowResultModal(true);
      } else if (data.status === 'finished' && data.winnerId) {
        setGameStatus('lost');
        setBoardShake(true);
        setTimeout(() => setBoardShake(false), 500);
        const newStats = { ...stats, losses: stats.losses + 1 };
        setStats(newStats); saveStatsToStorage(newStats);
        const loseScore = -(3 + Math.floor(Math.random() * 3));
        setScoreChange(`${loseScore}`);
        setPerformanceResult({
          score: Math.abs(loseScore), grade: 'D', gradeLabel: '继续加油',
          gradeColor: '#EF4444', bgGradient: 'from-red-500 to-orange-500',
          title: '继续加油', ratingChange: loseScore,
          rawRatingChange: loseScore,
          difficultyCoeff: 0.2, strengthCoeff: 0.6,
          highlights: [], performanceBonuses: [], breakdown: {}
        });
        processMatchFinish(false, Math.abs(loseScore), 'D', '继续加油');
        setShowResultModal(true);
      } else {
        setGameStatus('draw');
        const newStats = { ...stats, draws: stats.draws + 1 };
        setStats(newStats); saveStatsToStorage(newStats);
        const drawScore = 1 + Math.floor(Math.random() * 3);
        setScoreChange(`+${drawScore}`);
        setPerformanceResult({
          score: drawScore, grade: 'C', gradeLabel: '势均力敌',
          gradeColor: '#F59E0B', bgGradient: 'from-amber-500 to-yellow-500',
          title: '势均力敌', ratingChange: drawScore,
          rawRatingChange: drawScore,
          difficultyCoeff: 0.3, strengthCoeff: 0.8,
          highlights: [], performanceBonuses: [], breakdown: {}
        });
        processMatchFinish(false, drawScore + 5, 'C', '势均力敌');
        setShowResultModal(true);
      }
    }
  });

  const initMatch = useCallback(async () => {
    if (initializingRef.current) return;
    initializingRef.current = true;
    try {
      if (mode === 'pvp' && _matchId) {
        setMatchId(_matchId);
        const res = await gameApi.getMatch(_matchId);
        if (res.code === 200 && res.data) {
          const m = res.data;
          const myId = useAuthStore.getState().user?.id;
          const amIBlack = Number(m.player1_id) === myId;
          setMyColor(amIBlack ? 'black' : 'white');
          setCurrentPlayer(BLACK);
          const oppId = amIBlack ? m.player2_id : m.player1_id;
          const oppName = amIBlack ? (m.player2_name || '对方') : (m.player1_name || '对方');
          const oppAvatar = amIBlack ? (m.player2_avatar || null) : (m.player1_avatar || null);
          setPvpOpponent({ nickname: oppName, avatar: oppAvatar });
          if (m.moves && Array.isArray(m.moves)) {
            try {
              const parsed = typeof m.moves === 'string' ? JSON.parse(m.moves) : m.moves;
              if (parsed.length > 0) {
                let rebuilt = createEmptyBoard();
                let turn = BLACK;
                let bc = 0, wc = 0;
                let lm: [number, number] | null = null;
                for (const mv of parsed) {
                  const r = mv.position?.[0] ?? 0;
                  const c = mv.position?.[1] ?? 0;
                  const st = mv.color === 'white' ? WHITE : BLACK;
                  const { newBoard, captured } = placeStone(rebuilt, r, c, st);
                  if (st === BLACK) bc += captured.length; else wc += captured.length;
                  rebuilt = newBoard;
                  turn = turn === BLACK ? WHITE : BLACK;
                  lm = [r, c];
                }
                setBoard(rebuilt);
                setCurrentPlayer(turn);
                setMoveCount(parsed.length);
                setLastMove(lm);
                setBlackCaptures(bc);
                setWhiteCaptures(wc);
              }
            } catch {}
          }
        }
        setPvpLoaded(true);
        return;
      }
      const res = await gameApi.createMatch({
        gameType: 'go',
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
  }, [mode, _matchId]);

  useEffect(() => {
    if (gameStatus === 'playing' && !matchId && !isAIThinking) {
      initMatch();
    }
  }, [gameStatus, matchId, isAIThinking, initMatch, mode, _matchId]);

  useEffect(() => {
    if (gameStatus === 'idle') {
      resetBoard();
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showReplay || gameStatus !== 'playing') {
        if (e.key === 'Escape' && gameStatus !== 'playing') return;
        if (e.key === 'r' || e.key === 'R') { resetBoard(); return; }
        if (e.key === 'Escape') { surrender(); return; }
        return;
      }
      if (e.key === 'p' || e.key === 'P') handlePass();
      else if (e.key === 'r' || e.key === 'R') resetBoard();
      else if (e.key === 'Escape') surrender();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const endGame = useCallback((result: 'won' | 'lost' | 'draw') => {
    if (result === 'won') {
      setGameStatus('won');
      setBoardGlow(true);
      setTimeout(() => setBoardGlow(false), 1500);
      const newStats = { ...stats, wins: stats.wins + 1 };
      setStats(newStats); saveStatsToStorage(newStats);
      const winScore = 10 + Math.floor(Math.random() * 3);
      setScoreChange(`+${winScore}`);
      setPerformanceResult({
        score: winScore, grade: 'B', gradeLabel: '表现出色',
        gradeColor: '#3B82F6', bgGradient: 'from-blue-500 to-cyan-500',
        title: '表现出色', ratingChange: winScore,
        rawRatingChange: winScore,
        difficultyCoeff: 0.4, strengthCoeff: 1.0,
        highlights: [], performanceBonuses: [], breakdown: {}
      });
      processMatchFinish(true, winScore, 'B', '表现出色');
      setShowResultModal(true);
      recordDifficultyResult(true);
    } else if (result === 'lost') {
      setGameStatus('lost');
      setBoardShake(true);
      setTimeout(() => setBoardShake(false), 500);
      const newStats = { ...stats, losses: stats.losses + 1 };
      setStats(newStats); saveStatsToStorage(newStats);
      const loseScore = -(3 + Math.floor(Math.random() * 3));
      setScoreChange(`${loseScore}`);
      setPerformanceResult({
        score: Math.abs(loseScore), grade: 'D', gradeLabel: '继续加油',
        gradeColor: '#EF4444', bgGradient: 'from-red-500 to-orange-500',
        title: '继续加油', ratingChange: loseScore,
        rawRatingChange: loseScore,
        difficultyCoeff: 0.2, strengthCoeff: 0.6,
        highlights: [], performanceBonuses: [], breakdown: {}
      });
      processMatchFinish(false, Math.abs(loseScore), 'D', '继续加油');
      setShowResultModal(true);
      recordDifficultyResult(false);
    } else {
      setGameStatus('draw');
      const newStats = { ...stats, draws: stats.draws + 1 };
      setStats(newStats); saveStatsToStorage(newStats);
      const drawScore = 1 + Math.floor(Math.random() * 3);
      setScoreChange(`+${drawScore}`);
      setPerformanceResult({
        score: drawScore, grade: 'C', gradeLabel: '势均力敌',
        gradeColor: '#F59E0B', bgGradient: 'from-amber-500 to-yellow-500',
        title: '势均力敌', ratingChange: drawScore,
        rawRatingChange: drawScore,
        difficultyCoeff: 0.3, strengthCoeff: 0.8,
        highlights: [], performanceBonuses: [], breakdown: {}
      });
      processMatchFinish(false, drawScore + 5, 'C', '势均力敌');
      setShowResultModal(true);
      recordDifficultyResult(false);
    }
  }, [stats, processMatchFinish, onGameOver]);

  const handleClick = useCallback((row: number, col: number) => {
    if (gameStatus !== 'playing' || isAIThinking) return;
    const color = currentPlayer;
    const isMyTurn = mode === 'pvp'
      ? (myColor === 'black' ? color === BLACK : color === WHITE)
      : true;
    if (!isMyTurn) return;
    if (!isValidMove(board, row, col, color, koPoint)) return;

    setHistory(h => [...h, { board: copyBoard(board), player: currentPlayer, lastMove, ko: koPoint }].slice(-40));

    const { newBoard, captured } = placeStone(board, row, col, color);
    if (color === BLACK) setBlackCaptures(bc => bc + captured.length);
    else setWhiteCaptures(wc => wc + captured.length);

    if (captured.length === 1) setKoPoint(captured[0]);
    else setKoPoint(null);

    setBoard(newBoard);
    setCurrentPlayer(color === BLACK ? WHITE : BLACK);
    setLastMove([row, col]);
    setMoveCount(c => c + 1);
    setPassCount(0);
    setFlashCell([row, col]);
    setTimeout(() => setFlashCell(null), 300);

    if (matchId) {
      gameApi.move(matchId, {
        position: [row, col],
        symbol: color === BLACK ? 'black' : 'white',
        color: color === BLACK ? 'black' : 'white'
      }).catch(() => {});
    }

    if (mode === 'ai') {
      setIsAIThinking(true);
      thinkTimeRef.current = getDynamicDifficulty('go' as GameType, moveCount).thinkTime;
    }
  }, [board, currentPlayer, gameStatus, isAIThinking, lastMove, koPoint, matchId, mode, myColor]);

  const handlePass = useCallback(() => {
    if (gameStatus !== 'playing' || isAIThinking) return;
    const isMyTurn = mode === 'pvp'
      ? (myColor === 'black' ? currentPlayer === BLACK : currentPlayer === WHITE)
      : true;
    if (!isMyTurn) return;

    setPassCount(pc => {
      const newPc = pc + 1;
      if (newPc >= 2) {
        const finalScore = calculateScore(board);
        const iAmBlack = mode === 'pvp' ? myColor === 'black' : true;
        const won = iAmBlack ? finalScore.black > finalScore.white : finalScore.white > finalScore.black;
        setTimeout(() => endGame(won ? 'won' : finalScore.black === finalScore.white ? 'draw' : 'lost'), 100);
      }
      return newPc;
    });

    setHistory(h => [...h, { board: copyBoard(board), player: currentPlayer, lastMove: null, ko: koPoint }].slice(-40));
    setCurrentPlayer(p => p === BLACK ? WHITE : BLACK);
    setKoPoint(null);
    setLastMove(null);

    if (mode === 'ai') {
      setIsAIThinking(true);
      thinkTimeRef.current = getDynamicDifficulty('go' as GameType, moveCount).thinkTime;
    }
  }, [board, currentPlayer, gameStatus, isAIThinking, koPoint, matchId, mode, myColor, endGame]);

  useEffect(() => {
    if (!isAIThinking || gameStatus !== 'playing' || mode === 'pvp') return;
    const tt = thinkTimeRef.current;
    const phases = getThinkingPhases(tt);
    let progress = 0;
    let phaseIndex = 0;
    const phaseLabels: Record<string, string> = OPPONENT_THINKING_LABELS;
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
      const aiColor = mode === 'ai'
        ? (myColor === 'black' ? WHITE : BLACK)
        : (currentPlayer === BLACK ? WHITE : BLACK);
      const aiMove = getAIMove(board, difficulty, aiColor, koPoint, moveCount);

      if (aiMove === null) {
        setPassCount(pc => {
          const newPc = pc + 1;
          if (newPc >= 2) {
            const finalScore = calculateScore(board);
            setTimeout(() => endGame(finalScore.black > finalScore.white ? 'lost' : finalScore.black === finalScore.white ? 'draw' : 'won'), 100);
          }
          return newPc;
        });
        setIsAIThinking(false);
        setThinkingPhase('');
        setAiThinkProgress(0);
        setCurrentPlayer(BLACK);
        setKoPoint(null);
        setLastMove(null);
        return;
      }

      setHistory(h => [...h, { board: copyBoard(board), player: currentPlayer, lastMove, ko: koPoint }].slice(-40));

      const [ar, ac] = aiMove;
      const { newBoard, captured } = placeStone(board, ar, ac, aiColor);
      if (aiColor === BLACK) setBlackCaptures(bc => bc + captured.length);
      else setWhiteCaptures(wc => wc + captured.length);

      if (captured.length === 1) setKoPoint(captured[0]);
      else setKoPoint(null);

      setBoard(newBoard);
      setCurrentPlayer(BLACK);
      setLastMove(aiMove);
      setMoveCount(c => c + 1);
      setPassCount(0);
      setFlashCell(aiMove);
      setTimeout(() => setFlashCell(null), 300);
      setIsAIThinking(false);
      setThinkingPhase('');
      setAiThinkProgress(0);

      if (matchId) {
        gameApi.move(matchId, {
          position: [ar, ac],
          symbol: aiColor === BLACK ? 'black' : 'white',
          color: aiColor === BLACK ? 'black' : 'white'
        }).catch(() => {});
      }

      const emptyCount = board.flat().filter(c => c === EMPTY).length;
      if (emptyCount <= 5 && Math.random() < 0.05) {
        const finalScore = calculateScore(newBoard);
        if (finalScore.black > finalScore.white + 15) {
          setTimeout(() => endGame('lost'), 200);
        }
      }
    }, tt);
    return () => { clearTimeout(timer); clearInterval(interval); setThinkingPhase(''); setAiThinkProgress(0); };
  }, [isAIThinking, gameStatus, board, currentPlayer, koPoint, moveCount, matchId, mode, difficulty, endGame]);

  const resetBoard = () => {
    setBoard(createEmptyBoard());
    setGameStatus('playing');
    setCurrentPlayer(BLACK);
    setIsAIThinking(false);
    setThinkingPhase('');
    setAiThinkProgress(0);
    setLastMove(null);
    setKoPoint(null);
    setMoveCount(0);
    setPassCount(0);
    setBlackCaptures(0);
    setWhiteCaptures(0);
    setHistory([]);
    setElapsedTime(0);
    setShowReplay(false);
    setFlashCell(null);
    setBoardShake(false);
    setBoardGlow(false);
    setMatchId(null);
    setScoreChange('');
    setMyColor(null);
    setPvpOpponent(null);
    setPvpLoaded(false);
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
    setScoreChange(`-${3 + Math.floor(Math.random() * 3)}`);
    setPerformanceResult({
      score: 6 + Math.floor(Math.random() * 3),
      grade: 'D',
      gradeLabel: '认输',
      gradeColor: '#9CA3AF',
      bgGradient: 'from-gray-400 to-gray-300',
      title: '认输',
      ratingChange: -(6 + Math.floor(Math.random() * 3)),
      rawRatingChange: -(6 + Math.floor(Math.random() * 3)),
      difficultyCoeff: 1.2,
      strengthCoeff: 1.0,
      highlights: [],
      performanceBonuses: [],
      breakdown: {}
    });
    setShowResultModal(true);
    recordDifficultyResult(false);
  };

  const shareResult = async () => {
    const total = stats.wins + stats.losses + stats.draws;
    const winRate = total > 0 ? ((stats.wins / total) * 100).toFixed(1) : '0.0';
    const diffLabel = mode === 'pvp' ? 'PVP对战' : `AI(${difficulty})`;
    const text = `🎮 围棋对局报告\n` +
      `模式: ${diffLabel}\n` +
      `结果: ${gameStatus === 'won' ? '✅ 胜利' : gameStatus === 'lost' ? '❌ 失败' : '🤝 平局'}\n` +
      `手数: ${moveCount} | 用时: ${formatTime(elapsedTime)}\n` +
      `提子: 黑${blackCaptures} 白${whiteCaptures}\n` +
      `历史战绩: ${stats.wins}胜/${stats.losses}负/${stats.draws}平 (胜率${winRate}%)\n` +
      `— IM Chat App 围棋`;
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
    : mode === 'pvp'
      ? (currentPlayer === BLACK ? '● 黑方' : '○ 白方') + ` 的回合${!pvpLoaded ? ' (连接中...)' : ''}`
      : (currentPlayer === BLACK ? '● 你的回合（黑棋）' : '○ 对手回合');

  const displayOpponent = mode === 'pvp' && pvpOpponent
    ? { nickname: pvpOpponent.nickname, avatar: pvpOpponent.avatar || '', rankLabel: 'PVP对手', rating: 0 }
    : opponent;

  const resultConfig: Record<string, { emoji: string; text: string; score: string; color: string }> = {
    won: { emoji: '🎉', text: '胜利!', score: scoreChange || '+10', color: 'text-green-500' },
    lost: { emoji: '😔', text: '失败', score: scoreChange || '-4', color: 'text-red-500' },
    draw: { emoji: '🤝', text: '平局', score: scoreChange || '+2', color: 'text-yellow-500' }
  };
  const rc = gameStatus !== 'playing' && gameStatus !== 'idle' ? resultConfig[gameStatus] : null;

  const totalGames = stats.wins + stats.losses + stats.draws;
  const winRate = totalGames > 0 ? ((stats.wins / totalGames) * 100).toFixed(1) : '0.0';

  const cellSize = typeof window !== 'undefined' ? Math.min(32, (window.innerWidth - 80) / (BOARD_SIZE + 1)) : 28;
  const boardPx = cellSize * (BOARD_SIZE + 1);
  const stoneRadius = cellSize * 0.42;

  return (
    <div className="max-w-[90vw] sm:max-w-sm mx-auto flex flex-col items-center gap-3 sm:gap-4 relative overflow-hidden">
      <GameResultModal
        open={showResultModal}
        result={gameStatus === 'won' ? 'win' : gameStatus === 'lost' ? 'loss' : 'draw'}
        gameType="go"
        performanceData={performanceResult}
        gameStats={{
          moveCount: moveCount,
          durationSeconds: elapsedTime,
          winRate: `${winRate}%`,
          totalWins: stats.wins,
          totalGames: stats.wins + stats.losses + stats.draws
        }}
        onRestart={() => {
          setShowResultModal(false);
          resetBoard();
        }}
        onClose={() => {
          setShowResultModal(false);
          onGameOver?.(gameStatus === 'won' ? 'win' : gameStatus === 'lost' ? 'loss' : 'draw');
        }}
      />

      {/* Opponent Info Card */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/60 dark:border-gray-700/50 p-4 shadow-sm">
        {displayOpponent ? (
          <>
            <div className="flex items-center gap-3 mb-3">
              {mode === 'pvp' && pvpOpponent?.avatar ? (
                <ImageWithLazyLoad src={getAvatarUrl(pvpOpponent.avatar)} alt={pvpOpponent.nickname} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 object-cover" />
              ) : displayOpponent?.avatar ? (
                <ImageWithLazyLoad src={getAvatarUrl(displayOpponent.avatar)} alt={displayOpponent.nickname} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {displayOpponent?.nickname?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{displayOpponent.nickname}</p>
                <p className="text-xs text-gray-500">{mode === 'pvp' ? `PVP对战 · 你执${myColor === 'black' ? '黑' : myColor === 'white' ? '白' : '?'}` : `围棋对局 · 你执黑棋`}</p>
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
              ) :
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />{myColor === 'black' ? '先手' : '后手'}</span>}
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

      <div className="w-full bg-gradient-to-br from-amber-600 via-yellow-700 to-orange-700 rounded-2xl p-[1px] shadow-lg">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 space-y-3 sm:space-y-4">
          {/* Status Bar */}
          <div className="flex items-center justify-between">
            <span className={clsx(
              "text-xs sm:text-sm font-medium px-3 py-1.5 rounded-full transition-all",
              gameStatus === 'playing' && !isAIThinking
                ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md"
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

            {isAIThinking && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 6, opacity: 1 }} className="mt-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <motion.div
                  className={clsx("h-full rounded-full transition-all", "bg-amber-500")}
                  initial={{ width: '0%' }}
                  animate={{ width: `${aiThinkProgress}%` }}
                  transition={{ ease: 'linear', duration: thinkTimeRef.current / 800 }}
                />
              </motion.div>
            )}

            <div className="flex items-center gap-1.5">
              <div className="relative">
                <button
                  onClick={() => setShowDifficultyTip(v => !v)}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="对局信息"
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
                      <p>{mode === 'pvp' ? 'PVP联机围棋' : '围棋对局'}</p>
                      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 flex justify-between">
                        <span className="text-gray-400">棋盘</span>
                        <span className="font-medium">9×9路</span>
                      </div>
                      <div className="mt-1 flex justify-between">
                        <span className="text-gray-400">手数</span>
                        <span className="font-medium">{moveCount}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <Trophy size={16} className="text-gray-400" />
            </div>
          </div>

          {/* Go Board */}
          <div
            className="relative mx-auto rounded-lg overflow-hidden shadow-inner"
            style={{
              width: boardPx,
              height: boardPx,
              background: 'linear-gradient(135deg, #DEB887 0%, #D2A679 30%, #C4956A 60%, #B8865A 100%)',
            }}
          >
            <svg width={boardPx} height={boardPx} className="absolute inset-0">
              {Array.from({ length: BOARD_SIZE }, (_, r) =>
                Array.from({ length: BOARD_SIZE }, (_, c) => (
                  <g key={`${r}-${c}`}>
                    {r === 0 && (
                      <line x1={cellSize * (c + 1)} y1={cellSize} x2={cellSize * (c + 1)} y2={cellSize * BOARD_SIZE}
                        stroke="#5a3e2b" strokeWidth={1} />
                    )}
                    {c === 0 && (
                      <line x1={cellSize} y1={cellSize * (r + 1)} x2={cellSize * BOARD_SIZE} y2={cellSize * (r + 1)}
                        stroke="#5a3e2b" strokeWidth={1} />
                    )}
                  </g>
                ))
              )}
              {STAR_POINTS.filter(([r, c]) => r < BOARD_SIZE && c < BOARD_SIZE).map(([sr, sc]) => (
                <circle key={`star-${sr}-${sc}`} cx={cellSize * (sc + 1)} cy={cellSize * (sr + 1)} r={cellSize * 0.12} fill="#3a2415" />
              ))}
            </svg>

            {Array.from({ length: BOARD_SIZE }, (_, r) =>
              Array.from({ length: BOARD_SIZE }, (_, c) => {
                const stone = board[r][c];
                const isLast = lastMove && lastMove[0] === r && lastMove[1] === c;
                const isFlashing = flashCell && flashCell[0] === r && flashCell[1] === c;
                return (
                  <motion.button
                    key={`${r}-${c}`}
                    onClick={() => handleClick(r, c)}
                    disabled={gameStatus !== 'playing' || isAIThinking || stone !== EMPTY}
                    whileHover={stone === EMPTY && gameStatus === 'playing' && !isAIThinking ? { scale: 1.15 } : {}}
                    whileTap={stone === EMPTY && gameStatus === 'playing' && !isAIThinking ? { scale: 0.9 } : {}}
                    className={clsx(
                      'absolute rounded-full cursor-pointer select-none',
                      isFlashing && 'ring-2 ring-blue-400 ring-offset-1 ring-offset-transparent'
                    )}
                    style={{
                      left: cellSize * (c + 1) - cellSize * 0.45,
                      top: cellSize * (r + 1) - cellSize * 0.45,
                      width: cellSize * 0.9,
                      height: cellSize * 0.9,
                      zIndex: stone !== EMPTY ? 10 : 5,
                    }}
                    aria-label={`${String.fromCharCode(65 + c)}${BOARD_SIZE - r}${stone === BLACK ? ' 黑棋' : stone === WHITE ? ' 白棋' : ' 空位'}${isLast ? ' 最后落子' : ''}`}
                  >
                    {stone === EMPTY && gameStatus === 'playing' && !isAIThinking && (
                      <span className="block w-full h-full rounded-full hover:bg-black/10 active:bg-black/20 transition-colors" />
                    )}
                    {stone === BLACK && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        className="w-full h-full rounded-full"
                        style={{
                          background: 'radial-gradient(circle at 35% 30%, #555, #1a1a1a 45%, #000 80%)',
                          boxShadow: '2px 3px 6px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.15)',
                        }}
                      >
                        {isLast && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-1/4 h-1/4 rounded-full bg-red-500" />
                          </div>
                        )}
                      </motion.div>
                    )}
                    {stone === WHITE && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        className="w-full h-full rounded-full border border-gray-300"
                        style={{
                          background: 'radial-gradient(circle at 35% 30%, #fff, #f0f0f0 45%, #ddd 80%, #ccc)',
                          boxShadow: '2px 3px 6px rgba(0,0,0,0.3), inset 0 -1px 2px rgba(0,0,0,0.1)',
                        }}
                      >
                        {isLast && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-1/4 h-1/4 rounded-full bg-red-500" />
                          </div>
                        )}
                      </motion.div>
                    )}
                  </motion.button>
                );
              })
            )}

            {boardShake && (
              <motion.div
                className="absolute inset-0 pointer-events-none rounded-lg"
                animate={{ x: [0, -4, 4, -3, 3, -2, 2, 0] }}
                transition={{ duration: 0.4 }}
                style={{ boxShadow: 'inset 0 0 20px rgba(239,68,68,0.3)' }}
              />
            )}
          </div>

          {/* Capture Info Bar */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-black border border-gray-600" />
              <span>提{blackCaptures}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Target size={13} />
              <span>{moveCount}手</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={13} />
              <span className="tabular-nums font-mono">{formatTime(elapsedTime)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-white border border-gray-300" />
              <span>提{whiteCaptures}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={handlePass}
              disabled={gameStatus !== 'playing' || isAIThinking}
              className={clsx(
                'flex-1 min-h-[44px] sm:min-h-[48px] py-2 px-3 rounded-xl font-medium text-sm',
                'border-2 transition-all duration-200 flex items-center justify-center gap-1.5',
                gameStatus === 'playing' && !isAIThinking
                  ? 'border-violet-400 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md'
                  : 'border-gray-200 dark:border-gray-700 text-gray-300 cursor-not-allowed'
              )}
              aria-label="跳过(Pass)"
              title="Pass (P)"
            >
              <CircleDot size={15} />
              Pass
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
              className="flex-1 min-h-[44px] sm:min-h-[48px] py-2 px-3 rounded-xl font-medium text-sm bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-amber-500/25 hover:shadow-xl"
              aria-label="重新开始（快捷键R）"
              title="重开 (R)"
            >
              再来一局
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes flash {
          0%, 100% { background-color: transparent; }
          50% { background-color: rgba(59,130,246,0.15); }
        }
        .animate-flash { animation: flash 0.3s ease-in-out; }
      `}</style>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.matchId === nextProps.matchId &&
         prevProps.mode === nextProps.mode &&
         prevProps.onGameOver === nextProps.onGameOver;
});
