import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { gameApi } from '../../../api/game';
import {
  createInitialBoard, pieceName, getLegalMoves, makeMove, getAIMove,
  isCheckmate, isInCheck, MoveRecord
} from './chessEngine';
import type { Board, Piece, Position, Color } from './chessEngine';
import { ROWS, COLS } from './chessEngine';

interface ChineseChessBoardProps {
  matchId?: number;
  onGameOver?: (result: 'win' | 'loss' | 'draw') => void;
  aiDifficulty?: string;
  mode?: 'ai';
}

type GameStatus = 'playing' | 'won' | 'lost' | 'draw';

const COL_LABELS = 'abcdefghi';

const DIFFICULTY_CONFIG = {
  easy: {
    label: '初出茅庐',
    desc: 'AI随机+贪婪策略',
    thinkTime: 1400,
    color: 'text-green-500',
    barColor: 'bg-green-500'
  },
  medium: {
    label: '棋逢对手',
    desc: 'Alpha-Beta深度3',
    thinkTime: 1100,
    color: 'text-yellow-500',
    barColor: 'bg-yellow-500'
  },
  hard: {
    label: '深谋远虑',
    desc: 'Alpha-Beta深度4+开局库',
    thinkTime: 900,
    color: 'text-red-500',
    barColor: 'bg-red-500'
  }
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function getCoordLabel(row: number, col: number): string {
  return `${COL_LABELS[col]}${row}`;
}

if (typeof document !== 'undefined') {
  const oldStyle = document.getElementById('chess-grid-styles');
  if (oldStyle) oldStyle.remove();
  const style = document.createElement('style');
  style.id = 'chess-grid-styles';
  style.textContent = `
    .chess-board-grid { isolation: isolate; }
    .chess-cell {
      width: 100% !important;
      aspect-ratio: 1 / 1 !important;
      position: relative;
      padding: 0;
      border: none;
      background: transparent;
      cursor: pointer;
    }
    .chess-cell::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 0.7px;
      transform: translateY(-50%);
      background: #3D1F00;
      pointer-events: none;
      z-index: 1;
    }
    .chess-cell::after {
      content: '';
      position: absolute;
      left: 50%;
      top: 0;
      bottom: 0;
      width: 0.7px;
      transform: translateX(-50%);
      background: #3D1F00;
      pointer-events: none;
      z-index: 1;
    }
    .chess-cell-river-h {
      border-top: 0.7px solid transparent;
      border-bottom: 0.7px solid transparent;
    }
    .chess-outer-border {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border: 2.5px solid #3D1F00;
      pointer-events: none;
      z-index: 6;
    }
  `;
  document.head.appendChild(style);
}

const ChessPiece = React.memo(({ piece, isSelected, isCheck, isLastMove, isAnimating }: {
  piece: Piece;
  isSelected: boolean;
  isCheck: boolean;
  isLastMove: boolean;
  isAnimating: boolean;
}) => {
  const isRed = piece.color === 'red';

  return (
    <motion.div
      initial={isAnimating ? { scale: 0, opacity: 0 } : false}
      animate={{
        scale: 1,
        opacity: 1,
        boxShadow: isSelected
          ? '0 0 0 3px #3b82f6, 0 0 16px rgba(59,130,246,0.5)'
          : isCheck
          ? '0 0 0 3px #ef4444, 0 0 16px rgba(239,68,68,0.5)'
          : '1px 2px 5px rgba(0,0,0,0.35)'
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={clsx(
        'absolute rounded-full flex items-center justify-center select-none z-10',
        isLastMove && 'ring-2 ring-blue-400 ring-offset-1 ring-offset-transparent'
      )}
      style={{
        width: '82%',
        height: '82%',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: isRed
          ? 'radial-gradient(circle at 35% 30%, #fff5e6, #f0d9a0 40%, #e8c870 70%, #d4a030)'
          : 'radial-gradient(circle at 35% 30%, #666, #3a3a3a 45%, #1a1a1a 80%, #0a0a0a)',
        border: isRed ? '1.5px solid #c89830' : '1.5px solid #333',
        fontSize: 'min(1.3em, calc(var(--ccs) * 0.55))',
        fontWeight: 700,
        color: isRed ? '#8B0000' : '#e0e0e0',
        textShadow: isRed ? '0 1px 1px rgba(0,0,0,0.15)' : '0 1px 1px rgba(0,0,0,0.5)',
        cursor: 'pointer'
      }}
    >
      {pieceName(piece)}
    </motion.div>
  );
});
ChessPiece.displayName = 'ChessPiece';

export function ChineseChessBoard({
  matchId: _matchId,
  onGameOver,
  aiDifficulty = 'medium',
  mode = 'ai'
}: ChineseChessBoardProps) {
  const [board, setBoard] = useState<Board>(createInitialBoard);
  const [currentTurn, setCurrentTurn] = useState<Color>('red');
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [legalMoves, setLegalMoves] = useState<Position[]>([]);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [lastMoveFrom, setLastMoveFrom] = useState<Position | null>(null);
  const [lastMoveTo, setLastMoveTo] = useState<Position | null>(null);
  const [history, setHistory] = useState<MoveRecord[]>([]);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [aiThinkProgress, setAiThinkProgress] = useState(0);
  const [checkState, setCheckState] = useState<Color | null>(null);
  const [matchId, setMatchId] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const config = DIFFICULTY_CONFIG[aiDifficulty as keyof typeof DIFFICULTY_CONFIG] || DIFFICULTY_CONFIG.medium;

  const handleClick = useCallback((row: number, col: number) => {
    if (gameStatus !== 'playing' || currentTurn !== 'red' || isAIThinking) return;

    const clickedPiece = board[row][col];

    if (selectedPos) {
      const isLegal = legalMoves.some(m => m.row === row && m.col === col);
      if (isLegal) {
        const captured = board[row][col];
        const { newBoard } = makeMove(board, selectedPos, { row, col });

        setBoard(newBoard);
        setCurrentTurn('black');
        setLastMoveFrom(selectedPos);
        setLastMoveTo({ row, col });
        setHistory(h => [...h, {
          from: selectedPos,
          to: { row, col },
          piece: board[selectedPos.row][selectedPos.col]!,
          captured: captured
        }]);
        setSelectedPos(null);
        setLegalMoves([]);

        if (matchId) {
          gameApi.move(matchId, { position: [row, col], symbol: 'R' }).catch(() => {});
        }

        if (captured?.type === 'king') {
          setGameStatus('won');
          saveGameResult('won');
          onGameOver?.('win');
          return;
        }

        if (isInCheck(newBoard, 'black')) setCheckState('black');
        else setCheckState(null);

        setIsAIThinking(true);
        return;
      }
    }

    if (clickedPiece && clickedPiece.color === 'red') {
      setSelectedPos({ row, col });
      setLegalMoves(getLegalMoves(board, { row, col }));
    } else {
      setSelectedPos(null);
      setLegalMoves([]);
    }
  }, [board, gameStatus, currentTurn, isAIThinking, selectedPos, legalMoves, matchId, onGameOver]);

  useEffect(() => {
    if (gameStatus === 'playing') {
      timerRef.current = setInterval(() => setTimerSeconds(s => s + 1), 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [gameStatus]);

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
      const moveCount = history.filter(h => h.piece.color === 'black').length;
      const aiMove = getAIMove(currentBoard, aiDifficulty as 'easy'|'medium'|'hard', 'black', moveCount);
      const { newBoard, captured } = makeMove(currentBoard, aiMove.from, aiMove.to);

      setBoard(newBoard);
      setCurrentTurn('red');
      setLastMoveFrom(aiMove.from);
      setLastMoveTo(aiMove.to);
      setHistory(h => [...h, {
        from: aiMove.from,
        to: aiMove.to,
        piece: currentBoard[aiMove.from.row][aiMove.from.col]!,
        captured
      }]);
      setIsAIThinking(false);
      setAiThinkProgress(0);

      if (matchId) {
        gameApi.move(matchId, { position: [aiMove.to.row, aiMove.to.col], symbol: 'B' }).catch(() => {});
      }

      if (captured?.type === 'king') {
        setGameStatus('lost');
        saveGameResult('lost');
        onGameOver?.('loss');
        return;
      }

      if (isInCheck(newBoard, 'red')) setCheckState('red');
      else setCheckState(null);
    }, config.thinkTime);

    return () => { clearTimeout(timer); clearInterval(interval); setAiThinkProgress(0); };
  }, [isAIThinking, gameStatus, board, aiDifficulty, onGameOver, config.thinkTime, history, matchId]);

  useEffect(() => {
    const initMatch = async () => {
      try {
        const res = await gameApi.createMatch({
          game_type: 'chess',
          mode: 'ai',
          ai_difficulty: aiDifficulty
        });
        if (res.code === 200 && res.data) setMatchId(res.data.id);
      } catch { console.log('[Chess] 创建对局失败，离线模式'); }
    };
    initMatch();
  }, []);

  const resetBoard = () => {
    setBoard(createInitialBoard());
    setCurrentTurn('red');
    setGameStatus('playing');
    setSelectedPos(null);
    setLegalMoves([]);
    setIsAIThinking(false);
    setLastMoveFrom(null);
    setLastMoveTo(null);
    setHistory([]);
    setTimerSeconds(0);
    setCheckState(null);
    setAiThinkProgress(0);
    gameApi.createMatch({ game_type: 'chess', mode: 'ai', ai_difficulty: aiDifficulty })
      .then(res => { if (res.code === 200 && res.data) setMatchId(res.data.id); })
      .catch(() => {});
  };

  const surrender = async () => {
    if (gameStatus !== 'playing') return;
    if (matchId) { try { await gameApi.surrender(matchId); } catch {} }
    setGameStatus('lost');
    saveGameResult('lost');
    onGameOver?.('loss');
  };

  const saveGameResult = (result: 'win' | 'loss' | 'draw') => {
    try {
      const key = 'chess_stats';
      const raw = localStorage.getItem(key);
      const data = raw ? JSON.parse(raw) : { wins: 0, losses: 0, draws: 0, games: 0 };
      if (result === 'won') data.wins++;
      else if (result === 'lost') data.losses++;
      else data.draws++;
      data.games++;
      localStorage.setItem(key, JSON.stringify(data));
    } catch {}
  };

  const storedStats = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('chess_stats') || '{"wins":0,"losses":0,"draws":0,"games":0}'); }
    catch { return { wins: 0, losses: 0, draws: 0, games: 0 }; }
  }, []);

  const statusText = gameStatus !== 'playing'
    ? ''
    : isAIThinking ? '⚫ AI 思考中... (黑方)' : '🔴 你的回合 (红方)';

  const resultConfig = {
    won: { emoji: '🏆', text: '将军! 绝杀!', score: '+30', color: 'text-green-600' },
    lost: { emoji: '😔', text: '将死! 再接再厉', score: '-15', color: 'text-red-600' },
    draw: { emoji: '🤝', text: '和棋', score: '+5', color: 'text-yellow-600' }
  };

  const cellSizeVar = 'min(28px, calc((100vw - 240px) / 9))';

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-4 p-2 lg:p-4 items-start relative overflow-hidden">
      <div className="flex-1 flex flex-col items-center gap-3 w-full lg:w-auto">
        <div className="w-full max-w-[560px] bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl px-4 py-2.5 shadow-sm border border-gray-200/60 dark:border-gray-700/50">
          <div className="flex items-center justify-between gap-3">
            <span className={clsx(
              "text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap",
              gameStatus === 'playing' && !isAIThinking
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                : "bg-gray-100 text-gray-500 dark:bg-gray-700/50 dark:text-gray-400"
            )}>
              {statusText}
            </span>
            {selectedPos && (
              <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-md">
                {getCoordLabel(selectedPos.row, selectedPos.col)}
              </span>
            )}
            <span className="font-mono text-xs font-medium text-gray-600 dark:text-gray-400 ml-auto tabular-nums">
              {formatTime(timerSeconds)}
            </span>
          </div>
          {isAIThinking && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 6, opacity: 1 }} className="mt-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <motion.div
                className={clsx("h-full rounded-full transition-all", config.barColor)}
                initial={{ width: '0%' }}
                animate={{ width: `${aiThinkProgress}%` }}
                transition={{ ease: 'linear', duration: config.thinkTime / 800 }}
              />
            </motion.div>
          )}
        </div>

        <div className="relative overflow-hidden rounded-2xl shadow-xl" style={{
          background: 'linear-gradient(145deg, #F5DEB3 0%, #E8C98B 25%, #DDB878 50%, #D4B06A 75%, #CBA65A 100%)',
          padding: '12px'
        }}>
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none rounded-2xl" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: '180px 180px'
          }} />

          <div className="chess-board-grid chess-outer-border" style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${COLS}, var(--ccs))`,
            gridTemplateRows: `repeat(${ROWS}, var(--ccs))`,
            '--ccs': cellSizeVar,
            position: 'relative'
          } as React.CSSProperties}>
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const piece = cell;
                const isSelected = selectedPos?.row === rowIndex && selectedPos?.col === colIndex;
                const isLMFrom = lastMoveFrom?.row === rowIndex && lastMoveFrom?.col === colIndex;
                const isLMTo = lastMoveTo?.row === rowIndex && lastMoveTo?.col === colIndex;
                const isLegalTarget = legalMoves.some(m => m.row === rowIndex && m.col === colIndex);
                const isCaptureTarget = isLegalTarget && piece !== null;
                const kingInCheck = piece && checkState === piece.color && piece.type === 'king';
                const canClick = gameStatus === 'playing' && currentTurn === 'red' && !isAIThinking;

                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => handleClick(rowIndex, colIndex)}
                    className={clsx(
                      'chess-cell outline-none relative',
                      canClick && 'hover:bg-amber-400/10',
                      isSelected && 'bg-blue-400/20'
                    )}
                    style={{ zIndex: isSelected ? 5 : 'auto' }}
                  >
                    {isLegalTarget && !piece && (
                      <div className="absolute rounded-full bg-amber-500/40 dark:bg-amber-400/50 z-[4]"
                        style={{
                          width: '22%',
                          height: '22%',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)'
                        }} />
                    )}
                    {isCaptureTarget && (
                      <div className="absolute rounded-full z-[4] pointer-events-none"
                        style={{
                          width: '88%',
                          height: '88%',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          border: '2.5px dashed rgba(239,68,68,0.7)'
                        }} />
                    )}
                    {piece && (
                      <ChessPiece
                        piece={piece}
                        isSelected={!!isSelected}
                        isCheck={!!kingInCheck}
                        isLastMove={isLMTo}
                        isAnimating={true}
                      />
                    )}
                    {isLMFrom && (
                      <div className="absolute rounded-full border-2 border-blue-400/40 pointer-events-none z-[3]"
                        style={{
                          width: '92%',
                          height: '92%',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)'
                        }} />
                    )}
                  </button>
                );
              })
            )}

            {checkState && (
              <motion.div
                className="absolute rounded-full border-4 border-red-500 pointer-events-none z-20"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  width: 'calc(var(--ccs) * 0.88)',
                  height: 'calc(var(--ccs) * 0.88)',
                  top: `calc(var(--ccs) * ${board.findIndex(r => r.findIndex(c => c?.type === 'king' && c?.color === checkState) !== -1)} + var(--ccs) * 0.06)`,
                  left: `calc(var(--ccs) * ${(() => {
                    for (let r = 0; r < ROWS; r++) {
                      const c = board[r].findIndex(cell => cell?.type === 'king' && cell?.color === checkState);
                      if (c !== -1) return c;
                    }
                    return 4;
                  })()} + var(--ccs) * 0.06)`
                }}
              />
            )}

            <div className="absolute pointer-events-none z-[5]" style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              writingMode: 'vertical-rl',
              fontSize: 'min(1.2em, calc(var(--ccs) * 0.4))',
              fontWeight: 700,
              color: '#3D1F00',
              opacity: 0.5,
              letterSpacing: '1.5em',
              lineHeight: '2'
            }}>
              楚河    汉界
            </div>

            <div className="absolute pointer-events-none z-[2]" style={{
              inset: 'calc(var(--ccs) * 0.5)',
              border: '2.5px solid #3D1F00'
            }} />
          </div>
        </div>

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
          >认输</button>
          <button
            onClick={resetBoard}
            className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all"
          >新局</button>
        </div>

        <div className={clsx("text-xs px-3 py-1.5 rounded-lg font-medium", config.color, "dark:bg-opacity-20")}>
          {config.label} - {config.desc}
        </div>
      </div>

      <div className="w-full lg:w-[240px] flex flex-col gap-3 shrink-0">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/60 dark:border-gray-700/50 p-4 shadow-sm">
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">对局信息</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">总步数</span>
              <span className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200">{history.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-red-200 to-red-400 border border-red-400" />
                <span className="text-xs text-gray-500">红方(你)</span>
              </div>
              <span className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200">
                {history.filter(h => h.piece.color === 'red').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-gray-400 to-gray-800" />
                <span className="text-xs text-gray-500">黑方(AI)</span>
              </div>
              <span className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200">
                {history.filter(h => h.piece.color === 'black').length}
              </span>
            </div>
            <div className="border-t border-gray-100 dark:border-gray-700 pt-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">用时</span>
                <span className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200">{formatTime(timerSeconds)}</span>
              </div>
            </div>
            {checkState && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-red-500 font-semibold">⚠ 将军</span>
                <span className="text-xs text-red-500">
                  {checkState === 'red' ? '红方被将军' : '黑方被将军'}
                </span>
              </div>
            )}
          </div>
        </div>

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

        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/60 dark:border-gray-700/50 p-4 shadow-sm">
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">棋子分值</h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span>帥/將</span><span className="font-mono">∞</span></div>
            <div className="flex justify-between"><span>車</span><span className="font-mono">900</span></div>
            <div className="flex justify-between"><span>馬</span><span className="font-mono">400</span></div>
            <div className="flex justify-between"><span>炮</span><span className="font-mono">450</span></div>
            <div className="flex justify-between"><span>相/象</span><span className="font-mono">200</span></div>
            <div className="flex justify-between"><span>仕/士</span><span className="font-mono">200</span></div>
            <div className="flex justify-between"><span>兵/卒(过河)</span><span className="font-mono">200</span></div>
            <div className="flex justify-between"><span>兵/卒(未过河)</span><span className="font-mono">100</span></div>
          </div>
        </div>
      </div>

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
              >{resultConfig[gameStatus].emoji}</motion.p>
              <p className="text-xl font-bold text-gray-800 dark:text-gray-200">{resultConfig[gameStatus].text}</p>
              <p className={clsx("text-base font-bold", resultConfig[gameStatus].color)}>
                积分 {resultConfig[gameStatus].score}
              </p>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 space-y-1.5 text-left text-xs">
                <div className="flex justify-between"><span className="text-gray-500">总步数</span><span className="font-mono font-semibold">{history.length}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">用时</span><span className="font-mono font-semibold">{formatTime(timerSeconds)}</span></div>
              </div>
              <button
                onClick={resetBoard}
                className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 shadow-md transition-all"
              >再来一局</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
