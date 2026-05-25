import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { Circle, CircleDot, Crown, Clock, Trophy, TrendingUp, Gamepad2, ArrowLeft, User, Star, Flame, ChevronUp, Sparkles } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { RankBadge } from '../components/games/RankBadge';
import { TicTacToeBoard } from '../components/games/TicTacToeBoard';
import { GomokuBoard } from '../components/games/GomokuBoard';
import { ChineseChessBoard } from '../components/games/ChineseChessBoard';

type ActiveGame = null | 'tictactoe' | 'gomoku' | 'chess';
type TabType = 'leaderboard' | 'history';

export function Games() {
  const [searchParams] = useSearchParams();
  const urlMatchId = searchParams.get('matchId');
  const urlGameType = searchParams.get('gameType') as ActiveGame | null;

  const {
    profile,
    leaderboard,
    history,
    isLoading,
    isHistoryLoading,
    error,
    fetchProfile,
    fetchLeaderboard,
    fetchHistory,
    clearError
  } = useGameStore();

  const [activeGame, setActiveGame] = useState<ActiveGame>(null);
  const [activeTab, setActiveTab] = useState<TabType>('leaderboard');
  const [pvpMatchId, setPvpMatchId] = useState<number | null>(null);
  const [pvpLoading, setPvpLoading] = useState(false);

  useEffect(() => {
    if (urlMatchId && urlGameType && ['tictactoe', 'gomoku', 'chess'].includes(urlGameType)) {
      setActiveGame(urlGameType);
      setPvpMatchId(Number(urlMatchId));
    }
  }, [urlMatchId, urlGameType]);

  useEffect(() => {
    fetchProfile();
    fetchLeaderboard();
    fetchHistory();
  }, [fetchProfile, fetchLeaderboard, fetchHistory]);

  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [error, clearError]);

  const handleGameOver = (result: 'win' | 'loss' | 'draw') => {
    console.log(`Game over: ${result}`);
    setTimeout(() => {
      fetchProfile();
    }, 500);
  };

  const handleBackToLobby = () => {
    setActiveGame(null);
    setPvpMatchId(null);
    window.history.replaceState({}, '', '/games');
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return `${mins}分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  if (activeGame === 'tictactoe') {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#FAFAFC] dark:bg-[#0A0C10] p-4">
        <div className="w-full max-w-2xl flex items-center justify-between mb-4">
          <button
            onClick={handleBackToLobby}
            className="flex items-center gap-2 px-4 py-2 rounded-[14px] bg-white/60 dark:bg-gray-800/40 backdrop-blur-sm border border-black/5 dark:border-white/5 text-gray-700 dark:text-gray-300 hover:bg-white/80 transition-all shadow-sm"
          >
            <ArrowLeft size={16} />
            返回大厅
          </button>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {pvpMatchId ? 'PVP 对战' : '在线对局'}
          </div>
        </div>
        <TicTacToeBoard
          mode={pvpMatchId ? 'pvp' : 'ai'}
          matchId={pvpMatchId || undefined}
          onGameOver={handleGameOver}
        />
      </div>
    );
  }

  if (activeGame === 'gomoku') {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#FAFAFC] dark:bg-[#0A0C10] p-4 overflow-auto">
        <div className="w-full max-w-2xl flex items-center justify-between mb-4">
          <button
            onClick={handleBackToLobby}
            className="flex items-center gap-2 px-4 py-2 rounded-[14px] bg-white/60 dark:bg-gray-800/40 backdrop-blur-sm border border-black/5 dark:border-white/5 text-gray-700 dark:text-gray-300 hover:bg-white/80 transition-all shadow-sm"
          >
            <ArrowLeft size={16} />
            返回大厅
          </button>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {pvpMatchId ? 'PVP 对战' : '在线对局'}
          </div>
        </div>
        <GomokuBoard
          mode={pvpMatchId ? 'pvp' : 'ai'}
          matchId={pvpMatchId || undefined}
          onGameOver={handleGameOver}
        />
      </div>
    );
  }

  if (activeGame === 'chess') {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#FAFAFC] dark:bg-[#0A0C10] p-4 overflow-auto">
        <div className="w-full max-w-2xl flex items-center justify-between mb-4">
          <button
            onClick={handleBackToLobby}
            className="flex items-center gap-2 px-4 py-2 rounded-[14px] bg-white/60 dark:bg-gray-800/40 backdrop-blur-sm border border-black/5 dark:border-white/5 text-gray-700 dark:text-gray-300 hover:bg-white/80 transition-all shadow-sm"
          >
            <ArrowLeft size={16} />
            返回大厅
          </button>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {pvpMatchId ? 'PVP 对战' : '在线对局'}
          </div>
        </div>
        <ChineseChessBoard
          mode={pvpMatchId ? 'pvp' : 'ai'}
          matchId={pvpMatchId || undefined}
          onGameOver={handleGameOver}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#FAFAFC] dark:bg-[#0A0C10] overflow-auto">
      <div className="p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-[14px] p-6 shadow-xl text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
          
          {/* 背景动画光斑 */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              animate={{
                x: [0, 100, -50, 0],
                y: [0, -50, 50, 0],
                scale: [1, 1.2, 0.8, 1]
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute top-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                x: [0, -80, 60, 0],
                y: [0, 60, -40, 0],
                scale: [1, 0.9, 1.3, 1]
              }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear", delay: 2 }}
              className="absolute bottom-10 left-10 w-32 h-32 bg-yellow-300/15 rounded-full blur-3xl"
            />
          </div>

          {/* 粒子效果/星星点缀 */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                opacity: [0.2, 0.8, 0.2],
                scale: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: i * 0.4
              }}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                top: `${10 + (i % 4) * 25}%`,
                left: `${15 + (i % 3) * 30}%`
              }}
            />
          ))}

          {/* 浮动装饰图标 */}
          {profile && (() => {
            const tierIcons = {
              iron: '⚙️',
              bronze: '🥉',
              silver: '🥈',
              gold: '🥇',
              platinum: '💎',
              emerald: '💚',
              diamond: '👑',
              master: '🌟'
            };
            return (
              <motion.div
                animate={{ y: [-5, 5, -5], rotate: [-5, 5, -5] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-4 right-6 text-4xl z-20"
              >
                {tierIcons[profile.rank_tier as keyof typeof tierIcons] || '⭐'}
              </motion.div>
            );
          })()}

          <div className="relative z-10 flex items-center gap-6">
            {profile && (
              <>
                <RankBadge tier={profile.rank_tier} rating={profile.rating} size="lg" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold">{profile.rating}</span>
                    <span className="text-sm opacity-80">积分</span>
                    <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
                      最高 {profile.peak_rating}
                    </span>
                  </div>

                  {/* 段位进度条 */}
                  {(() => {
                    const tiers = [
                      { key: 'iron', min: 0 },
                      { key: 'bronze', min: 400 },
                      { key: 'silver', min: 1000 },
                      { key: 'gold', min: 1800 },
                      { key: 'platinum', min: 2700 },
                      { key: 'emerald', min: 3700 },
                      { key: 'diamond', min: 4700 },
                      { key: 'master', min: 6000 }
                    ];
                    const currentTierIdx = tiers.findIndex(t => t.key === profile.rank_tier);
                    const currentTier = tiers[currentTierIdx] || tiers[0];
                    const nextTier = tiers[currentTierIdx + 1];
                    const progress = nextTier 
                      ? ((profile.rating - currentTier.min) / (nextTier.min - currentTier.min)) * 100 
                      : 100;
                    
                    return (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs opacity-75 mb-1">
                          <span>距离下一段位</span>
                          <span>{nextTier ? nextTier.key.toUpperCase() : '巅峰'}</span>
                        </div>
                        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(progress, 100)}%` }}
                            transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                            className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex items-center gap-4 text-sm opacity-90 pt-1">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      {profile.wins} 胜
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                      {profile.losses} 负
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
                      {profile.draws} 平
                    </span>
                    
                    {/* 胜率环形进度条 */}
                    <div className="flex items-center gap-1.5">
                      <div className="relative w-6 h-6">
                        <svg className="w-6 h-6 transform -rotate-90" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                          <motion.circle
                            cx="12"
                            cy="12"
                            r="10"
                            fill="none"
                            stroke="url(#winRateGradient)"
                            strokeWidth="2"
                            strokeDasharray={`${(profile.total_games > 0 ? (profile.wins / profile.total_games) : 0) * 62.83} 62.83`}
                            initial={{ strokeDasharray: '0 62.83' }}
                            animate={{ strokeDasharray: `${(profile.total_games > 0 ? (profile.wins / profile.total_games) : 0) * 62.83} 62.83` }}
                            transition={{ duration: 1.5, delay: 0.8, ease: 'easeOut' }}
                            strokeLinecap="round"
                          />
                          <defs>
                            <linearGradient id="winRateGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#86efac" />
                              <stop offset="100%" stopColor="#22c55e" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold">
                          {profile.total_games > 0 ? Math.round((profile.wins / profile.total_games) * 100) : 0}%
                        </span>
                      </div>
                      <span className="text-xs">胜率</span>
                    </div>

                    <span className="text-xs opacity-75">总计 {profile.total_games} 场</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs opacity-75">
                    <TrendingUp size={14} />
                    连胜:
                    <motion.span
                      animate={profile.current_win_streak > 0 ? {
                        scale: [1, 1.1, 1],
                        color: ['#ffffff', '#fbbf24', '#ffffff']
                      } : {}}
                      transition={{ duration: 1.5, repeat: profile.current_win_streak > 0 ? Infinity : 0 }}
                      className="inline-flex items-center gap-1"
                    >
                      {profile.current_win_streak > 0 && <Flame size={14} className="text-yellow-300" />}
                      {profile.current_win_streak}
                    </motion.span>
                    <span className="mx-1">|</span>
                    最佳: {profile.best_win_streak}
                  </div>

                  {/* 本局表现预览提示（示例） */}
                  {profile.total_games > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.2 }}
                      className="flex items-center gap-2 text-xs bg-white/10 px-3 py-1.5 rounded-lg mt-1 inline-flex"
                    >
                      <Sparkles size={14} className="text-yellow-300" />
                      <span>最近表现优异，继续保持！</span>
                      <ChevronUp size={14} className="text-green-300" />
                    </motion.div>
                  )}
                </div>
              </>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <motion.button
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveGame('tictactoe')}
            className="group relative bg-white/70 dark:bg-gray-800/50 backdrop-blur-xl rounded-[14px] p-6 shadow-lg border border-black/5 dark:border-white/5 text-left transition-all hover:shadow-xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/30 dark:bg-blue-900/20 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500" />

            <div className="relative z-10 space-y-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-[14px] flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <CircleDot size={28} className="text-white" strokeWidth={2.5} />
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">井字棋</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">经典三子连线，快速对决</p>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-400">
                <User size={14} />
                <span>实时匹配</span>
                <span className="mx-1">·</span>
                <Clock size={14} />
                <span>约 2 分钟</span>
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveGame('gomoku')}
            className="group relative bg-white/70 dark:bg-gray-800/50 backdrop-blur-xl rounded-[14px] p-6 shadow-lg border border-black/5 dark:border-white/5 text-left transition-all hover:shadow-xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/30 dark:bg-emerald-900/20 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500" />

            <div className="relative z-10 space-y-4">
              <div className="w-14 h-14 bg-gradient-to-br from-gray-700 to-gray-900 rounded-[14px] flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <Circle size={28} className="text-white" fill="white" strokeWidth={2} />
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">五子棋</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">策略五子连珠，智慧博弈</p>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-400">
                <User size={14} />
                <span>实时匹配</span>
                <span className="mx-1">·</span>
                <Clock size={14} />
                <span>约 5-15 分钟</span>
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveGame('chess')}
            className="group relative bg-white/70 dark:bg-gray-800/50 backdrop-blur-xl rounded-[14px] p-6 shadow-lg border border-black/5 dark:border-white/5 text-left transition-all hover:shadow-xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-100/30 dark:bg-red-900/20 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500" />

            <div className="relative z-10 space-y-4">
              <div className="w-14 h-14 bg-gradient-to-br from-red-400 to-red-600 rounded-[14px] flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <Crown size={28} className="text-white" strokeWidth={2.5} />
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">中国象棋</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">经典象棋对弈，运筹帷幄</p>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-400">
                <User size={14} />
                <span>实时匹配</span>
                <span className="mx-1">·</span>
                <Clock size={14} />
                <span>约 10-30 分钟</span>
              </div>
            </div>
          </motion.button>
        </div>

        <div className="bg-white/70 dark:bg-gray-800/50 backdrop-blur-xl rounded-[14px] shadow-lg border border-black/5 dark:border-white/5 overflow-hidden">
          <div className="flex border-b border-black/5 dark:border-white/5">
            {(['leaderboard', 'history'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={clsx(
                  "flex-1 px-6 py-3 text-sm font-medium transition-all relative",
                  activeTab === tab
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                )}
              >
                <span className="flex items-center justify-center gap-2">
                  {tab === 'leaderboard' ? <><Trophy size={16} /> 排行榜</> : <><Clock size={16} /> 我的对局</>}
                </span>
                {activeTab === tab && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>

          <div className="p-4 max-h-[400px] overflow-auto">
            <AnimatePresence mode="wait">
              {activeTab === 'leaderboard' && (
                <motion.div
                  key="leaderboard"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-2"
                >
                  {isLoading && leaderboard.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      加载中...
                    </div>
                  ) : leaderboard.length > 0 ? (
                    leaderboard.map((entry, index) => (
                      <motion.div
                        key={entry.user_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={clsx(
                          "flex items-center gap-4 p-3 rounded-xl transition-all hover:bg-gray-50 dark:hover:bg-gray-800/50 relative",
                          index === 0 && "bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 border-2 border-yellow-400 dark:border-yellow-500 shadow-md shadow-yellow-200/50 dark:shadow-yellow-900/20",
                          index === 1 && "bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/30 dark:to-slate-800/30 border-2 border-gray-400 dark:border-gray-500 shadow-md shadow-gray-200/50 dark:shadow-gray-700/20",
                          index === 2 && "bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 border-2 border-orange-400 dark:border-orange-500 shadow-md shadow-orange-200/50 dark:shadow-orange-900/20",
                          index >= 3 && "bg-white/50 dark:bg-gray-800/20"
                        )}
                      >
                        {/* 前三名特殊标识 */}
                        {index === 0 && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.05 + 0.3, type: 'spring', stiffness: 300 }}
                            className="absolute -top-2 -right-2 text-lg"
                          >
                            👑
                          </motion.div>
                        )}

                        <div className={clsx(
                          "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm relative",
                          index === 0 && "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg",
                          index === 1 && "bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-lg",
                          index === 2 && "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg",
                          index >= 3 && "bg-gray-100 dark:bg-gray-800 text-gray-500"
                        )}>
                          {index + 1}
                          {index < 3 && (
                            <motion.div
                              animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                              transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                              className="absolute inset-0 rounded-full"
                              style={{
                                background: index === 0 ? 'radial-gradient(circle, rgba(255,215,0,0.4) 0%, transparent 70%)' :
                                           index === 1 ? 'radial-gradient(circle, rgba(192,192,192,0.4) 0%, transparent 70%)' :
                                                     'radial-gradient(circle, rgba(255,140,0,0.4) 0%, transparent 70%)'
                              }}
                            />
                          )}
                        </div>

                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold overflow-hidden ring-2 ring-offset-2"
                          style={{
                            ringColor: index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : index === 2 ? '#fb923c' : 'transparent',
                            ringOffsetColor: index < 3 ? (index === 0 ? '#fef3c7' : index === 1 ? '#f3f4f6' : '#fff7ed') : 'transparent'
                          }}
                        >
                          {entry.avatar ? (
                            <img src={entry.avatar} alt={entry.nickname} className="w-full h-full object-cover" />
                          ) : (
                            entry.nickname[0]?.toUpperCase() || '?'
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">{entry.nickname}</p>
                          <RankBadge tier={entry.rank_tier} size="sm" showLabel={false} />
                        </div>

                        <div className="text-right space-y-0.5">
                          <p className="font-bold text-gray-900 dark:text-white">{entry.rating.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">
                            胜率 {(entry.win_rate * 100).toFixed(1)}%
                          </p>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      暂无排行数据
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'history' && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-2"
                >
                  {isHistoryLoading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/50 dark:bg-gray-800/30 border border-gray-100 dark:border-white/5 animate-pulse">
                          <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-40" />
                          </div>
                          <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded" />
                        </div>
                      ))}
                    </div>
                  ) : history.length === 0 ? (
                    <div className="text-center py-16 space-y-3">
                      <div className="w-20 h-20 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Gamepad2 size={36} className="text-gray-300" />
                      </div>
                      <p className="text-gray-500 font-medium">还没有对局记录</p>
                      <p className="text-sm text-gray-400">选择一个游戏模式开始你的第一场对局吧！</p>
                    </div>
                  ) : (
                    history.map((match, index) => {
                      const gameTypeConfig = {
                        tictactoe: { icon: CircleDot, name: '井字棋', color: 'from-blue-400 to-blue-600' },
                        gomoku: { icon: Circle, name: '五子棋', color: 'from-gray-700 to-gray-900' },
                        chess: { icon: Crown, name: '中国象棋', color: 'from-red-400 to-red-600' }
                      };
                      const config = gameTypeConfig[match.game_type];
                      const GameIcon = config.icon;

                      let resultText = '失败';
                      let resultColor = 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
                      let borderColor = 'border-transparent';

                      if (match.status === 'abandoned') {
                        resultText = '逃跑';
                        resultColor = 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400';
                        borderColor = 'border-dashed border-gray-300 dark:border-gray-600';
                      } else if (match.isWin) {
                        resultText = '胜利';
                        resultColor = 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
                        borderColor = 'border-green-300 dark:border-green-700';
                      } else if (match.isDraw) {
                        resultText = '平局';
                        resultColor = 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400';
                        borderColor = 'border-yellow-300 dark:border-yellow-700';
                      }

                      const gradeColors: Record<string, string> = {
                        S: '#ef4444',
                        A: '#f97316',
                        B: '#eab308',
                        C: '#22c55e',
                        D: '#3b82f6'
                      };

                      return (
                        <motion.div
                          key={match.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`flex items-center gap-4 p-4 rounded-xl bg-white/50 dark:bg-gray-800/30 border ${borderColor} hover:bg-white/80 dark:hover:bg-gray-800/50 transition-all`}
                        >
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center text-white text-xl shadow-md`}>
                            {match.game_type === 'gomoku' ? (
                              <GameIcon size={24} fill="white" strokeWidth={2} />
                            ) : (
                              <GameIcon size={24} strokeWidth={2.5} />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-gray-900 dark:text-white">{config.name}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${resultColor}`}>
                                {resultText}
                              </span>
                              {match.performance_grade && (
                                <span
                                  className="px-1.5 py-0.5 rounded text-xs font-bold"
                                  style={{ color: gradeColors[match.performance_grade] || '#9ca3af' }}
                                >
                                  {match.performance_grade}级
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                              <span>{match.mode === 'ai' ? '人机对战' : '玩家对战'}</span>
                              {match.ai_difficulty && match.mode === 'ai' && (
                                <span>难度 {match.ai_difficulty}</span>
                              )}
                              <span>{formatDuration(match.duration_seconds)}</span>
                              <span>{formatTimeAgo(match.created_at)}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className={`font-bold tabular-nums ${match.score_change > 0 ? 'text-green-500' : match.score_change < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                              {match.score_change > 0 ? '+' : ''}{match.score_change ?? '--'}
                            </p>
                            {match.performance_score != null && (
                              <p className="text-xs text-gray-400">{match.performance_score}分</p>
                            )}
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
