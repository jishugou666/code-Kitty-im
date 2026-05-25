import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Star, Trophy, Zap, Shield, Flame, Target, Crown, Share2, ChevronDown, ChevronUp, Home } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'motion/react';

interface GameResultModalProps {
  open: boolean;
  result: 'win' | 'loss' | 'draw';
  gameType: 'tictactoe' | 'gomoku' | 'chess';
  performanceData?: {
    score: number;
    grade: string;
    gradeLabel: string;
    gradeColor: string;
    bgGradient: string;
    title: string;
    ratingChange: number;
    rawRatingChange: number;
    difficultyCoeff: number;
    strengthCoeff: number;
    highlights: Array<{
      key: string;
      icon: string;
      name: string;
      desc: string;
      bonus: number;
    }>;
    performanceBonuses: Array<{
      key: string;
      value: number;
      label: string;
    }>;
    breakdown?: Record<string, any>;
  };
  gameStats?: {
    moveCount: number;
    durationSeconds: number;
    winRate?: string;
    totalWins?: number;
    totalGames?: number;
  };
  onRestart?: () => void;
  onClose?: () => void;
}

const GRADE_COLORS: Record<string, { primary: string; gradient: string; glow: string }> = {
  S: {
    primary: '#FF6B6B',
    gradient: 'from-red-500 via-orange-500 to-yellow-500',
    glow: 'rgba(255, 107, 107, 0.6)'
  },
  A: {
    primary: '#A855F7',
    gradient: 'from-purple-500 via-pink-500 to-rose-500',
    glow: 'rgba(168, 85, 247, 0.6)'
  },
  B: {
    primary: '#3B82F6',
    gradient: 'from-blue-500 via-cyan-400 to-teal-400',
    glow: 'rgba(59, 130, 246, 0.6)'
  },
  C: {
    primary: '#22C55E',
    gradient: 'from-green-500 via-emerald-400 to-green-300',
    glow: 'rgba(34, 197, 94, 0.6)'
  },
  D: {
    primary: '#9CA3AF',
    gradient: 'from-gray-400 via-gray-300 to-gray-200',
    glow: 'rgba(156, 163, 175, 0.4)'
  }
};

const RESULT_CONFIG = {
  win: { emoji: '\u{1F389}', text: '胜利!', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30' },
  loss: { emoji: '\u{1F614}', text: '失败', color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30' },
  draw: { emoji: '\u{1F91D}', text: '平局', color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' }
};

const GAME_TYPE_NAMES: Record<string, string> = {
  tictactoe: '井字棋',
  gomoku: '五子棋',
  chess: '中国象棋'
};

function CountUpAnimation({ target, duration = 1500 }: { target: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!isAnimating) return;

    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(eased * target);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [target, duration, isAnimating]);

  useEffect(() => {
    setIsAnimating(true);
  }, []);

  const integerPart = Math.floor(displayValue);
  const decimalPart = (displayValue % 1).toFixed(1).slice(2);

  return (
    <div className="flex items-baseline justify-center font-bold tabular-nums">
      <span className="text-5xl md:text-6xl tracking-tight text-white drop-shadow-lg">{integerPart}</span>
      <span className="text-2xl md:text-3xl opacity-80 text-white/80">.{decimalPart}</span>
    </div>
  );
}

function GradeBadge({ grade }: { grade: string }) {
  const config = GRADE_COLORS[grade] || GRADE_COLORS.D;
  const isSGrade = grade === 'S';

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
      className={clsx(
        'relative w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center',
        'shadow-2xl'
      )}
      style={{
        background: `radial-gradient(circle at 35% 35%, ${config.primary}dd, ${config.primary})`,
        boxShadow: `0 0 40px ${config.glow}, inset 0 -4px 12px rgba(0,0,0,0.3)`
      }}
    >
      <motion.div
        animate={isSGrade ? {
          scale: [1, 1.05, 1],
          boxShadow: [
            `0 0 40px ${config.glow}`,
            `0 0 60px ${config.glow}`,
            `0 0 40px ${config.glow}`
          ]
        } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-1 rounded-full bg-white/10 backdrop-blur-[2px]"
      />
      <span className="relative z-10 text-4xl md:text-5xl font-black text-white drop-shadow-lg tracking-wider">
        {grade}
      </span>
    </motion.div>
  );
}

function HighlightTag({ highlight, index }: { highlight: NonNullable<GameResultModalProps['performanceData']>['highlights'][number]; index: number }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.6 + index * 0.1, type: 'spring', stiffness: 200 }}
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className={clsx(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full',
        'bg-white/10 border border-white/20',
        'hover:bg-white/15 hover:border-white/30',
        'transition-all cursor-default'
      )}>
        <span className="text-base">{highlight.icon}</span>
        <span className="text-sm font-medium text-white whitespace-nowrap">
          {highlight.name}
        </span>
      </div>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-2 rounded-lg bg-gray-950 border border-white/15 shadow-xl max-w-xs"
          >
            <p className="text-xs text-gray-200 whitespace-normal leading-relaxed">
              {highlight.desc}
            </p>
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-gray-950 border-l border-t border-white/15" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function GameResultModal({
  open,
  result,
  gameType,
  performanceData,
  gameStats,
  onRestart,
  onClose
}: GameResultModalProps) {
  const [showDetails, setShowDetails] = useState(false);
  const resultConfig = RESULT_CONFIG[result];
  const gradeConfig = performanceData ? (GRADE_COLORS[performanceData.grade] || GRADE_COLORS.D) : null;

  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  if (!open) return null;

  const content = (
    <AnimatePresence mode="wait">
      <motion.div
        key="game-result-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose?.()}
      >
        <div className="absolute inset-0 bg-black/75" />

        <motion.div
          key="game-result-card"
          initial={{ opacity: 0, y: 80, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.92 }}
          transition={{
            type: 'spring',
            stiffness: 280,
            damping: 26,
            delay: 0.08
          }}
          className="relative w-[92vw] max-w-md overflow-y-auto overflow-x-hidden rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-white/10 shadow-2xl shadow-black/50 max-h-[90vh]"
        >
          <div className="relative overflow-hidden">
            {gradeConfig && (
              <div className={clsx(
                'absolute inset-0 opacity-[0.07]',
                'bg-gradient-to-br',
                gradeConfig.gradient
              )} />
            )}

            <div className="relative p-5 sm:p-6 space-y-5">
              {/* 顶部结果区 */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.12, duration: 0.35 }}
                className={clsx(
                  'flex items-center justify-between p-3.5 rounded-xl border',
                  resultConfig.bgColor,
                  resultConfig.borderColor
                )}
              >
                <div className="flex items-center gap-3">
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, delay: 0.22 }}
                    className="text-2xl"
                  >
                    {resultConfig.emoji}
                  </motion.span>
                  <div>
                    <h2 className={clsx('text-lg font-bold', resultConfig.color)}>
                      {resultConfig.text}
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {GAME_TYPE_NAMES[gameType]}
                    </p>
                  </div>
                </div>

                {performanceData && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.28, type: 'spring', stiffness: 300 }}
                    className="text-right"
                  >
                    <div className={clsx(
                      'text-xl font-bold tabular-nums',
                      performanceData.ratingChange > 0 ? 'text-emerald-400' :
                      performanceData.ratingChange < 0 ? 'text-red-400' : 'text-gray-400'
                    )}>
                      {performanceData.ratingChange > 0 ? '+' : ''}{performanceData.ratingChange}
                    </div>
                    <p className="text-[11px] text-gray-500">积分</p>
                  </motion.div>
                )}
              </motion.div>

              {/* 核心表现分区 */}
              {performanceData && (
                <motion.div
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18, duration: 0.45 }}
                  className="space-y-3 py-4"
                >
                  <div className="flex flex-col items-center gap-3">
                    <GradeBadge grade={performanceData.grade} />

                    <div className="text-center space-y-1.5">
                      <CountUpAnimation target={performanceData.score} />

                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.75 }}
                        className="text-sm font-semibold text-white/90"
                      >
                        "{performanceData.title}"
                      </motion.p>
                    </div>
                  </div>

                  {performanceData.highlights.length > 0 && (
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
                      {performanceData.highlights.map((highlight, index) => (
                        <HighlightTag key={highlight.key} highlight={highlight} index={index} />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* 详细数据区（可折叠） */}
              {(gameStats || performanceData) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.85 }}
                  className="space-y-2.5"
                >
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="w-full flex items-center justify-between py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                  >
                    <span className="text-xs font-semibold text-gray-300 group-hover:text-white uppercase tracking-wider transition-colors">
                      详细数据
                    </span>
                    {showDetails ? (
                      <ChevronUp size={16} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={16} className="text-gray-400" />
                    )}
                  </button>

                  <AnimatePresence>
                    {showDetails && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-3 pb-2">
                          {gameStats && (
                            <div className="grid grid-cols-3 gap-2">
                              <div className="text-center p-2.5 rounded-lg bg-white/5">
                                <p className="text-base font-bold text-blue-400 tabular-nums">
                                  {formatDuration(gameStats.durationSeconds)}
                                </p>
                                <p className="text-[11px] text-gray-500 mt-0.5">用时</p>
                              </div>
                              <div className="text-center p-2.5 rounded-lg bg-white/5">
                                <p className="text-base font-bold text-purple-400 tabular-nums">
                                  {gameStats.moveCount}
                                </p>
                                <p className="text-[11px] text-gray-500 mt-0.5">步数</p>
                              </div>
                              {gameStats.winRate !== undefined && (
                                <div className="text-center p-2.5 rounded-lg bg-white/5">
                                  <p className="text-base font-bold text-emerald-400">
                                    {gameStats.winRate}
                                  </p>
                                  <p className="text-[11px] text-gray-500 mt-0.5">胜率</p>
                                </div>
                              )}
                            </div>
                          )}

                          {performanceData && (
                            <>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5">
                                  <span className="text-xs text-gray-400">难度系数</span>
                                  <span className="text-xs font-semibold text-amber-400">
                                    x{performanceData.difficultyCoeff.toFixed(1)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/5">
                                  <span className="text-xs text-gray-400">对手强度</span>
                                  <span className="text-xs font-semibold text-cyan-400">
                                    x{performanceData.strengthCoeff.toFixed(1)}
                                  </span>
                                </div>
                              </div>

                              {performanceData.performanceBonuses.length > 0 && (
                                <div className="space-y-1.5">
                                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                    表现加成
                                  </p>
                                  {performanceData.performanceBonuses.map((bonus) => (
                                    <div key={bonus.key} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/5">
                                      <span className="text-xs text-gray-300">{bonus.label}</span>
                                      <span className={clsx(
                                        'text-xs font-semibold tabular-nums',
                                        bonus.value >= 0 ? 'text-emerald-400' : 'text-red-400'
                                      )}>
                                        {bonus.value >= 0 ? '+' : ''}{bonus.value}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* 底部操作区 */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.95, duration: 0.35 }}
                className="flex gap-2.5 pt-3 border-t border-white/10"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onClose}
                  className={clsx(
                    'flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl font-semibold text-sm',
                    'bg-white/5 text-gray-300 border border-white/10',
                    'hover:bg-white/10 hover:text-white',
                    'transition-all duration-150'
                  )}
                >
                  <Home size={16} />
                  返回大厅
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onRestart}
                  className={clsx(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl font-semibold text-sm text-white',
                    'bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500',
                    'hover:from-blue-500 hover:via-indigo-400 hover:to-violet-400',
                    'shadow-lg shadow-blue-500/20',
                    'transition-all duration-150'
                  )}
                >
                  <Target size={16} />
                  再来一局
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: `${GAME_TYPE_NAMES[gameType]}对局结果`,
                        text: performanceData
                          ? `${resultConfig.text} - 等级${performanceData.grade} - 表现分${performanceData.score}`
                          : resultConfig.text,
                        url: window.location.href
                      });
                    }
                  }}
                  className={clsx(
                    'flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl font-semibold text-sm',
                    'bg-white/5 text-gray-300 border border-white/10',
                    'hover:bg-white/10 hover:text-white',
                    'transition-all duration-150'
                  )}
                >
                  <Share2 size={16} />
                </motion.button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
