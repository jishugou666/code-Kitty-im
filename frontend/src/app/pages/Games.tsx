import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { Circle, CircleDotBig, Crown, Clock, Trophy, TrendingUp, Gamepad2, Lock } from 'lucide-react';
import { useGameStore } from '../../store/gameStore';
import { RankBadge } from '../games/RankBadge';
import { TicTacToeBoard } from '../games/TicTacToeBoard';
import { GomokuBoard } from '../games/GomokuBoard';

type ActiveGame = null | 'tictactoe' | 'gomoku';
type TabType = 'leaderboard' | 'history';

export function Games() {
  const {
    profile,
    leaderboard,
    isLoading,
    error,
    fetchProfile,
    fetchLeaderboard,
    clearError
  } = useGameStore();

  const [activeGame, setActiveGame] = useState<ActiveGame>(null);
  const [activeTab, setActiveTab] = useState<TabType>('leaderboard');
  const [tictactoeDifficulty, setTictactoeDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [gomokuDifficulty, setGomokuDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  useEffect(() => {
    fetchProfile();
    fetchLeaderboard();
  }, [fetchProfile, fetchLeaderboard]);

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

  if (activeGame === 'tictactoe') {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#FAFAFC] dark:bg-[#0A0C10] p-4">
        <div className="w-full max-w-2xl flex items-center justify-between mb-4">
          <button
            onClick={() => setActiveGame(null)}
            className="flex items-center gap-2 px-4 py-2 rounded-[14px] bg-white/60 dark:bg-gray-800/40 backdrop-blur-sm border border-black/5 dark:border-white/5 text-gray-700 dark:text-gray-300 hover:bg-white/80 transition-all shadow-sm"
          >
            ← 返回大厅
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">难度:</span>
            {(['easy', 'medium', 'hard'] as const).map((diff) => (
              <button
                key={diff}
                onClick={() => setTictactoeDifficulty(diff)}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  tictactoeDifficulty === diff
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
              >
                {diff === 'easy' ? '简单' : diff === 'medium' ? '中等' : '困难'}
              </button>
            ))}
          </div>
        </div>
        <TicTacToeBoard
          aiDifficulty={tictactoeDifficulty}
          mode="ai"
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
            onClick={() => setActiveGame(null)}
            className="flex items-center gap-2 px-4 py-2 rounded-[14px] bg-white/60 dark:bg-gray-800/40 backdrop-blur-sm border border-black/5 dark:border-white/5 text-gray-700 dark:text-gray-300 hover:bg-white/80 transition-all shadow-sm"
          >
            ← 返回大厅
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">难度:</span>
            {(['easy', 'medium', 'hard'] as const).map((diff) => (
              <button
                key={diff}
                onClick={() => setGomokuDifficulty(diff)}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  gomokuDifficulty === diff
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
              >
                {diff === 'easy' ? '简单' : diff === 'medium' ? '中等' : '困难'}
              </button>
            ))}
          </div>
        </div>
        <GomokuBoard
          aiDifficulty={gomokuDifficulty}
          mode="ai"
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
                  <div className="flex items-center gap-4 text-sm opacity-90">
                    <span>🏆 {profile.wins} 胜</span>
                    <span>💔 {profile.losses} 负</span>
                    <span>🤝 {profile.draws} 平</span>
                    <span>📊 总计 {profile.total_games} 场</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs opacity-75">
                    <TrendingUp size={14} />
                    连胜: {profile.current_win_streak} | 最佳: {profile.best_win_streak}
                  </div>
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
                <CircleDotBig size={28} className="text-white" strokeWidth={2.5} />
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">井字棋</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">经典三子连线，快速对决</p>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Gamepad2 size={14} />
                <span>AI 对战</span>
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
                <Gamepad2 size={14} />
                <span>AI 对战</span>
                <span className="mx-1">·</span>
                <Clock size={14} />
                <span>约 5-15 分钟</span>
              </div>
            </div>
          </motion.button>

          <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            className="relative bg-gray-100/50 dark:bg-gray-800/30 backdrop-blur-xl rounded-[14px] p-6 shadow-lg border border-dashed border-gray-300 dark:border-gray-700 text-left cursor-not-allowed opacity-60"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-200/20 dark:bg-gray-700/10 rounded-full -translate-y-16 translate-x-16" />

            <div className="relative z-10 space-y-4">
              <div className="w-14 h-14 bg-gradient-to-br from-red-400 to-red-600 rounded-[14px] flex items-center justify-center shadow-md">
                <Crown size={28} className="text-white" strokeWidth={2.5} />
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                  中国象棋
                  <Lock size={16} className="text-gray-400" />
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">经典象棋对弈</p>
              </div>

              <div className="inline-flex items-center px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-full text-xs font-medium text-yellow-700 dark:text-yellow-400">
                即将推出
              </div>
            </div>
          </motion.div>
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
                          "flex items-center gap-4 p-3 rounded-xl transition-all hover:bg-gray-50 dark:hover:bg-gray-800/50",
                          index < 3 && "bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10"
                        )}
                      >
                        <div className={clsx(
                          "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                          index === 0 && "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white",
                          index === 1 && "bg-gradient-to-br from-gray-300 to-gray-500 text-white",
                          index === 2 && "bg-gradient-to-br from-orange-400 to-orange-600 text-white",
                          index >= 3 && "bg-gray-100 dark:bg-gray-800 text-gray-500"
                        )}>
                          {index + 1}
                        </div>

                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold overflow-hidden">
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
                  <div className="text-center py-12 text-gray-400">
                    <Clock size={48} className="mx-auto mb-3 opacity-30" />
                    <p>历史记录功能开发中...</p>
                    <p className="text-sm mt-1">敬请期待</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
