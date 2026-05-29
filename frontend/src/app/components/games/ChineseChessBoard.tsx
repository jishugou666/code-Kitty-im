import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { gameApi } from '../../../api/game';
import { Zap, Brain, Search, Target, User } from 'lucide-react';
import { generateOpponent, getDynamicDifficulty, getThinkingPhases, recordGameResult as recordDifficultyResult } from './dynamicDifficulty';
import type { Opponent, GameType } from './dynamicDifficulty';
import { useGameHeartbeat } from '../../../hooks/useGameHeartbeat';
import { useGameChannel } from '../../../hooks/useGameChannel';
import { useAuthStore } from '../../../store/authStore';
import { GameResultModal } from './GameResultModal';
import { getAvatarUrl } from '../../../lib/avatarCache';
import { ImageWithLazyLoad } from '../ui/ImageWithLazyLoad';
import {
  createInitialBoard, pieceName, getLegalMoves, makeMove, getAIMove,
  isCheckmate, isInCheck, MoveRecord
} from './chessEngine';
import type { Board, Piece, Position, Color } from './chessEngine';
import { ROWS, COLS } from './chessEngine';

interface ChineseChessBoardProps {
  matchId?: number;
  onGameOver?: (result: 'win' | 'loss' | 'draw') => void;
  mode?: 'ai' | 'pvp';
}

type GameStatus = 'playing' | 'won' | 'lost' | 'draw';

const COL_LABELS = 'abcdefghi';

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
    .chess-board-container { isolation: isolate; }
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
        'rounded-full flex items-center justify-center select-none z-10',
        isLastMove && 'ring-2 ring-blue-400 ring-offset-1 ring-offset-transparent'
      )}
      style={{
        width: '72%',
        height: '72%',
        flexShrink: 0,
        background: isRed
          ? 'radial-gradient(circle at 35% 30%, #fff5e6, #f0d9a0 40%, #e8c870 70%, #d4a030)'
          : 'radial-gradient(circle at 35% 30%, #666, #3a3a3a 45%, #1a1a1a 80%, #0a0a0a)',
        border: isRed ? '1.5px solid #c89830' : '1.5px solid #333',
        fontSize: 'min(1.2em, calc(var(--ccs) * 0.5))',
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

export const ChineseChessBoard = React.memo(function ChineseChessBoard({
  matchId: _matchId,
  onGameOver,
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
  const thinkTimeRef = useRef<number>(3500);
  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [thinkingPhase, setThinkingPhase] = useState<string>('');
  const [showResultModal, setShowResultModal] = useState(false);
  const [performanceResult, setPerformanceResult] = useState<any>(null);
  const [myColor, setMyColor] = useState<'red' | 'black' | null>(null);
  const [pvpOpponent, setPvpOpponent] = useState<{ nickname: string; avatar: string | null } | null>(null);
  const [pvpLoaded, setPvpLoaded] = useState(false);

  const processMatchFinish = useCallback(async (won: boolean, defaultScore: number, defaultGrade: string, defaultTitle: string) => {
    if (!matchId) {
      setPerformanceResult({
        score: defaultScore, grade: defaultGrade, gradeLabel: defaultTitle,
        gradeColor: defaultGrade === 'S' ? '#FF6B6B' : defaultGrade === 'A' ? '#A855F7' : defaultGrade === 'B' ? '#3B82F6' : '#22C55E',
        bgGradient: 'from-blue-500 to-cyan-500',
        title: defaultTitle, ratingChange: won ? defaultScore * 0.4 : -defaultScore * 0.2,
        rawRatingChange: won ? Math.round(defaultScore * 0.4) : -Math.round(defaultScore * 0.2),
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
          difficultyCoeff: 1.2,
          strengthCoeff: 1.0,
          highlights: finishRes.data.highlights || [],
          performanceBonuses: [],
          breakdown: finishRes.data.performance_details || {}
        });
      } else {
        setPerformanceResult({
          score: defaultScore, grade: defaultGrade, gradeLabel: defaultTitle,
          gradeColor: '#3B82F6', bgGradient: 'from-blue-500 to-cyan-500',
          title: defaultTitle, ratingChange: won ? 30 : -15,
          rawRatingChange: won ? 30 : -15,
          difficultyCoeff: 1.2, strengthCoeff: 1.0,
          highlights: [], performanceBonuses: [], breakdown: {}
        });
      }
    } catch {
      setPerformanceResult({
        score: defaultScore, grade: defaultGrade, gradeLabel: defaultTitle,
        gradeColor: '#3B82F6', bgGradient: 'from-blue-500 to-cyan-500',
        title: defaultTitle, ratingChange: won ? 30 : -15,
        rawRatingChange: won ? 30 : -15,
        difficultyCoeff: 1.2, strengthCoeff: 1.0,
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
      if (gameStatus !== 'playing') return;
      const toRow = data.position[0] ?? 0;
      const toCol = data.position[1] ?? 0;
      const moveColor = data.symbol === 'R' ? 'red' : 'black';
      setBoard(prevBoard => {
        let fromPos: Position | null = null;
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            const p = prevBoard[r][c];
            if (p && p.color === moveColor) {
              const legalMoves = getLegalMoves(prevBoard, { row: r, col: c });
              if (legalMoves.some(m => m.row === toRow && m.col === toCol)) {
                fromPos = { row: r, col: c };
                break;
              }
            }
          }
          if (fromPos) break;
        }
        if (!fromPos) return prevBoard;
        const { newBoard, captured } = makeMove(prevBoard, fromPos, { row: toRow, col: toCol });
        const nextTurn = moveColor === 'red' ? 'black' : 'red';
        setCurrentTurn(nextTurn);
        setLastMoveFrom(fromPos);
        setLastMoveTo({ row: toRow, col: toCol });
        setHistory(h => [...h, {
          from: fromPos,
          to: { row: toRow, col: toCol },
          piece: prevBoard[fromPos.row][fromPos.col]!,
          captured
        }]);
        setSelectedPos(null);
        setLegalMoves([]);
        if (captured?.type === 'king') {
          if (moveColor === myColor) {
            setGameStatus('won');
            saveGameResult('win');
            recordDifficultyResult(true);
            processMatchFinish(true, 80, 'B', '棋坛新秀');
            setShowResultModal(true);
            onGameOver?.('win');
          } else {
            setGameStatus('lost');
            saveGameResult('loss');
            recordDifficultyResult(false);
            processMatchFinish(false, 35, 'D', '继续努力');
            setShowResultModal(true);
            onGameOver?.('loss');
          }
          return newBoard;
        }
        const opponentKingColor = nextTurn;
        if (isInCheck(newBoard, opponentKingColor)) setCheckState(opponentKingColor);
        else setCheckState(null);
        return newBoard;
      });
    },
    onRemoteSurrender: () => {
      if (gameStatus !== 'playing') return;
      setGameStatus('won');
      saveGameResult('win');
      recordDifficultyResult(true);
      processMatchFinish(true, 80, 'B', '对方认输');
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
        processMatchFinish(true, 80, 'B', '表现出色');
        setShowResultModal(true);
        onGameOver?.('win');
      } else if (data.status === 'finished' && data.winnerId) {
        setGameStatus('lost');
        saveGameResult('loss');
        recordDifficultyResult(false);
        processMatchFinish(false, 35, 'D', '继续加油');
        setShowResultModal(true);
        onGameOver?.('loss');
      } else {
        setGameStatus('draw');
        processMatchFinish(false, 50, 'C', '势均力敌');
        setShowResultModal(true);
        onGameOver?.('draw');
      }
    }
  });

  const handleClick = useCallback((row: number, col: number) => {
    if (gameStatus !== 'playing' || isAIThinking) return;

    const clickedPiece = board[row][col];
    const canInteract = mode === 'pvp' ? (myColor ? currentTurn === myColor : true) : currentTurn === 'red';
    if (!canInteract && !selectedPos) return;

    if (selectedPos) {
      const isLegal = legalMoves.some(m => m.row === row && m.col === col);
      if (isLegal) {
        const captured = board[row][col];
        const movingPiece = board[selectedPos.row][selectedPos.col];
        const { newBoard } = makeMove(board, selectedPos, { row, col });
        const nextTurn = movingPiece?.color === 'red' ? 'black' : 'red';

        setBoard(newBoard);
        setCurrentTurn(nextTurn);
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
          gameApi.move(matchId, { position: [row, col], symbol: movingPiece?.color === 'red' ? 'R' : 'B' }).catch(() => {});
        }

        if (captured?.type === 'king') {
          if (movingPiece?.color === 'red') {
            setGameStatus('won');
            saveGameResult('win');
            recordDifficultyResult(true);

            processMatchFinish(true, 80, 'B', '棋坛新秀');
            setShowResultModal(true);

            onGameOver?.('win');
          } else {
            setGameStatus('lost');
            saveGameResult('loss');
            recordDifficultyResult(false);

            processMatchFinish(false, 35, 'D', '继续努力');
            setShowResultModal(true);

            onGameOver?.('loss');
          }
          return;
        }

        const opponentKingColor = nextTurn;
        if (isInCheck(newBoard, opponentKingColor)) setCheckState(opponentKingColor);
        else setCheckState(null);

        if (mode === 'ai') {
          setIsAIThinking(true);
          thinkTimeRef.current = getDynamicDifficulty('chinese_chess' as GameType, history.length).thinkTime;
        }
        return;
      }
    }

    if (clickedPiece && ((mode === 'pvp' && (clickedPiece.color === currentTurn)) || (mode === 'ai' && clickedPiece.color === 'red'))) {
      setSelectedPos({ row, col });
      setLegalMoves(getLegalMoves(board, { row, col }));
    } else {
      setSelectedPos(null);
      setLegalMoves([]);
    }
  }, [board, gameStatus, currentTurn, isAIThinking, selectedPos, legalMoves, matchId, onGameOver, mode, myColor]);

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
      const moveCount = history.filter(h => h.piece.color === 'black').length;
      const aiMove = getAIMove(currentBoard, 'medium', 'black', moveCount);
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
      setThinkingPhase('');

      if (matchId) {
        gameApi.move(matchId, { position: [aiMove.to.row, aiMove.to.col], symbol: 'B' }).catch(() => {});
      }

      if (captured?.type === 'king') {
        setGameStatus('lost');
        saveGameResult('loss');
        recordDifficultyResult(false);

        processMatchFinish(false, 35, 'D', '继续努力');
        setShowResultModal(true);

        onGameOver?.('loss');
        return;
      }

      if (isInCheck(newBoard, 'red')) setCheckState('red');
      else setCheckState(null);
    }, tt);

    return () => { clearTimeout(timer); clearInterval(interval); setAiThinkProgress(0); setThinkingPhase(''); };
  }, [isAIThinking, gameStatus, board, onGameOver, history, matchId, mode]);

  const initMatch = useCallback(async () => {
    try {
      if (mode === 'pvp' && _matchId) {
        setMatchId(_matchId);
        const res = await gameApi.getMatch(_matchId);
        if (res.code === 200 && res.data) {
          const m = res.data;
          const myId = useAuthStore.getState().user?.id;
          setMyColor(Number(m.player1_id) === myId ? 'red' : 'black');
          const oppId = Number(m.player1_id) === myId ? m.player2_id : m.player1_id;
          const oppName = Number(m.player1_id) === myId
            ? (m.player2_name || '对方')
            : (m.player1_name || '对方');
          const oppAvatar = Number(m.player1_id) === myId
            ? (m.player2_avatar || null)
            : (m.player1_avatar || null);
          setPvpOpponent({ nickname: oppName, avatar: oppAvatar });
        }
        setPvpLoaded(true);
        return;
      }
      const res = await gameApi.createMatch({
        gameType: 'chess',
        mode: 'ai'
      });
      if (res.code === 200 && res.data) setMatchId(res.data.id);
    } catch { console.log('[Chess] 创建对局失败，离线模式'); }
  }, [mode, _matchId]);

  useEffect(() => {
    initMatch();
  }, [initMatch]);

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
    gameApi.createMatch({ gameType: 'chess', mode: 'ai' })
      .then(res => { if (res.code === 200 && res.data) setMatchId(res.data.id); })
      .catch(() => {});
  };

  const surrender = async () => {
    if (gameStatus !== 'playing') return;
    if (matchId) { try { await gameApi.surrender(matchId); } catch {} }
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
      ratingChange: -15,
      rawRatingChange: -15,
      difficultyCoeff: 1.2,
      strengthCoeff: 1.0,
      highlights: [],
      performanceBonuses: [],
      breakdown: {}
    });
    setShowResultModal(true);
    onGameOver?.('loss');
  };

  const saveGameResult = (result: 'win' | 'loss' | 'draw') => {
    try {
      const key = 'chess_stats';
      const raw = localStorage.getItem(key);
      const data = raw ? JSON.parse(raw) : { wins: 0, losses: 0, draws: 0, games: 0 };
      if (result === 'win') data.wins++;
      else if (result === 'loss') data.losses++;
      else data.draws++;
      data.games++;
      localStorage.setItem(key, JSON.stringify(data));
    } catch {}
  };

  const storedStats = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('chess_stats') || '{"wins":0,"losses":0,"draws":0,"games":0}'); }
    catch { return { wins: 0, losses: 0, draws: 0, games: 0 }; }
  }, []);

  const displayOpponent = mode === 'pvp' && pvpOpponent
    ? { nickname: pvpOpponent.nickname, avatar: pvpOpponent.avatar || '', rankLabel: 'PVP对手', rating: 0 }
    : opponent;

  const statusText = gameStatus !== 'playing'
    ? ''
    : isAIThinking ? `⚫ ${opponent?.nickname || '对手'} ${thinkingPhase ? thinkingPhase + '...' : '思考中'} (黑方)`
    : mode === 'pvp' ? `${currentTurn === 'red' ? '🔴' : '⚫'} ${currentTurn === 'red' ? '红方' : '黑方'}的回合${currentTurn === myColor ? ' (你的回合)' : ''}${!pvpLoaded ? ' (连接中...)' : ''}`
    : '🔴 你的回合 (红方)';

  const resultConfig = {
    won: { emoji: '🏆', text: '将军! 绝杀!', score: '+30', color: 'text-green-600' },
    lost: { emoji: '😔', text: '将死! 再接再厉', score: '-15', color: 'text-red-600' },
    draw: { emoji: '🤝', text: '和棋', score: '+5', color: 'text-yellow-600' }
  };
  const rc = gameStatus !== 'playing' && gameStatus !== 'idle' ? resultConfig[gameStatus as keyof typeof resultConfig] : null;

  const cellSizeVar = 'min(46px, calc((100vw - 280px) / 9))';

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-4 p-2 lg:p-4 items-start relative">
      {/* 新的表现分结算弹窗 */}
      <GameResultModal
        open={showResultModal}
        result={gameStatus === 'won' ? 'win' : gameStatus === 'lost' ? 'loss' : 'draw'}
        gameType="chess"
        performanceData={performanceResult}
        gameStats={{
          moveCount: history.length,
          durationSeconds: timerSeconds,
          winRate: storedStats.games > 0 ? `${Math.round(storedStats.wins / storedStats.games * 100)}%` : '0%',
          totalWins: storedStats.wins,
          totalGames: storedStats.games
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
                className={clsx("h-full rounded-full transition-all", "bg-blue-500")}
                initial={{ width: '0%' }}
                animate={{ width: `${aiThinkProgress}%` }}
                transition={{ ease: 'linear', duration: thinkTimeRef.current / 800 }}
              />
            </motion.div>
          )}
        </div>

        <div className="relative rounded-2xl shadow-xl overflow-hidden" style={{
          background: 'linear-gradient(145deg, #F5DEB3 0%, #E8C98B 25%, #DDB878 50%, #D4B06A 75%, #CBA65A 100%)',
          padding: '4px'
        }}>
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none rounded-2xl" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: '180px 180px'
          }} />

          <div className="chess-board-container relative" style={{
            '--ccs': cellSizeVar,
            width: `calc(var(--ccs) * ${COLS})`,
            height: `calc(var(--ccs) * ${ROWS})`,
            position: 'relative',
            margin: '0 auto'
          } as React.CSSProperties}>
            {/* SVG Background for perfect alignment */}
            <svg
              width={`calc(var(--ccs) * ${COLS - 1})`}
              height={`calc(var(--ccs) * ${ROWS - 1})`}
              viewBox={`0 0 ${COLS - 1} ${ROWS - 1}`}
              preserveAspectRatio="xMidYMid meet"
              className="absolute pointer-events-none"
              style={{
                zIndex: 1,
                left: 'calc(var(--ccs) * 0.5)',
                top: 'calc(var(--ccs) * 0.5)'
              }}
            >
              {/* Grid lines */}
              {Array.from({ length: ROWS }).map((_, i) => (
                <line
                  key={`hl-${i}`}
                  x1="0"
                  y1={i}
                  x2={COLS - 1}
                  y2={i}
                  stroke="#3D1F00"
                  strokeWidth="0.03"
                />
              ))}
              {Array.from({ length: COLS }).map((_, i) => (
                <g key={`vl-${i}`}>
                  <line
                    x1={i}
                    y1="0"
                    x2={i}
                    y2={4}
                    stroke="#3D1F00"
                    strokeWidth="0.03"
                  />
                  <line
                    x1={i}
                    y1={5}
                    x2={i}
                    y2={ROWS - 1}
                    stroke="#3D1F00"
                    strokeWidth="0.03"
                  />
                </g>
              ))}
              {/* Palace diagonals (9 corners) */}
              <line x1="3" y1="0" x2="5" y2="2" stroke="#3D1F00" strokeWidth="0.03" />
              <line x1="5" y1="0" x2="3" y2="2" stroke="#3D1F00" strokeWidth="0.03" />
              <line x1="3" y1="7" x2="5" y2="9" stroke="#3D1F00" strokeWidth="0.03" />
              <line x1="5" y1="7" x2="3" y2="9" stroke="#3D1F00" strokeWidth="0.03" />
              {/* Flying general paths (the two outside lines for crossing river) */}
              <line x1="0" y1="4" x2="0" y2="5" stroke="#3D1F00" strokeWidth="0.03" />
              <line x1="8" y1="4" x2="8" y2="5" stroke="#3D1F00" strokeWidth="0.03" />
              {/* Outer border */}
              <rect x="-0.08" y="-0.08" width={COLS - 1 + 0.16} height={ROWS - 1 + 0.16} fill="none" stroke="#3D1F00" strokeWidth="0.08" />
              <rect x="0.15" y="0.15" width={COLS - 1 - 0.3} height={ROWS - 1 - 0.3} fill="none" stroke="#3D1F00" strokeWidth="0.03" />
            </svg>

            
            {/* Clickable cells as absolute positioned circles */}
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const piece = cell;
                const isSelected = selectedPos?.row === rowIndex && selectedPos?.col === colIndex;
                const isLMFrom = lastMoveFrom?.row === rowIndex && lastMoveFrom?.col === colIndex;
                const isLMTo = lastMoveTo?.row === rowIndex && lastMoveTo?.col === colIndex;
                const isLegalTarget = legalMoves.some(m => m.row === rowIndex && m.col === colIndex);
                const isCaptureTarget = isLegalTarget && piece !== null;
                const kingInCheck = piece && checkState === piece.color && piece.type === 'king';
                const canClick = gameStatus === 'playing' && !isAIThinking
                  && (mode === 'pvp' ? (myColor ? currentTurn === myColor : true) : currentTurn === 'red');

                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => handleClick(rowIndex, colIndex)}
                    className={clsx(
                      'absolute outline-none cursor-pointer',
                      canClick && 'hover:bg-amber-400/10',
                      isSelected && 'bg-blue-400/20'
                    )}
                    style={{
                      width: 'var(--ccs)',
                      height: 'var(--ccs)',
                      left: `calc(var(--ccs) * ${colIndex})`,
                      top: `calc(var(--ccs) * ${rowIndex})`,
                      zIndex: isSelected ? 15 : 5,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
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
                  top: `calc(var(--ccs) * ${(() => {
                    for (let r = 0; r < ROWS; r++) {
                      const c = board[r].findIndex(cell => cell?.type === 'king' && cell?.color === checkState);
                      if (c !== -1) return r;
                    }
                    return 0;
                  })()} - var(--ccs) * 0.44 + var(--ccs) * 0.06)`,
                  left: `calc(var(--ccs) * ${(() => {
                    for (let r = 0; r < ROWS; r++) {
                      const c = board[r].findIndex(cell => cell?.type === 'king' && cell?.color === checkState);
                      if (c !== -1) return c;
                    }
                    return 4;
                  })()} - var(--ccs) * 0.44 + var(--ccs) * 0.06)`
                }}
              />
            )}

            <div className="absolute pointer-events-none z-[1]" style={{
              left: '50%',
              top: '45%',
              transform: 'translate(-50%, -50%)',
              writingMode: 'vertical-rl',
              fontSize: 'min(1.2em, calc(var(--ccs) * 0.4))',
              fontWeight: 700,
              color: '#3D1F00',
              opacity: 0.35,
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

        <div className={clsx("text-xs px-3 py-1.5 rounded-lg font-medium", "text-blue-500", "dark:bg-opacity-20")}>
          对局时长 {Math.floor(timerSeconds / 60)}:{String(timerSeconds % 60).padStart(2, '0')}
        </div>
      </div>

      <div className="w-full lg:w-[240px] flex flex-col gap-3 shrink-0">
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
                  <p className="text-xs text-gray-500">{mode === 'pvp' ? `PVP对战 · 你执${myColor === 'red' ? '红' : '黑'}` : `${displayOpponent.rankLabel} · ${displayOpponent.rating}分`}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {mode === 'pvp' ? (
                  <>
                    <span className={`px-2 py-0.5 rounded-full ${pvpLoaded ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400'}`}>
                      {pvpLoaded ? '已连接' : '连接中...'}
                    </span>
                    <span className="flex items-center gap-1"><User size={12} />{myColor === 'red' ? '先手' : '后手'}</span>
                  </>
                ) : (
                  <>
                    <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full">实时匹配</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />在线</span>
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
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">对局信息</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">总步数</span>
              <span className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200">{history.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-red-200 to-red-400 border border-red-400" />
                <span className="text-xs text-gray-500">红方{mode === 'pvp' ? (myColor === 'red' ? '(你)' : `(${pvpOpponent?.nickname || '对方'})`) : '(你)'}</span>
              </div>
              <span className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200">
                {history.filter(h => h.piece.color === 'red').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-gray-400 to-gray-800" />
                <span className="text-xs text-gray-500">黑方{mode === 'pvp' ? (myColor === 'black' ? '(你)' : `(${pvpOpponent?.nickname || '对方'})`) : `(${opponent?.nickname || '对手'})`}</span>
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

    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.matchId === nextProps.matchId &&
         prevProps.mode === nextProps.mode &&
         prevProps.onGameOver === nextProps.onGameOver;
});
