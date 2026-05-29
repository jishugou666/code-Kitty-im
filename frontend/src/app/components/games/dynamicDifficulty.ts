import { gameApi } from '../../../api/game';
import { useAuthStore } from '../../../store/authStore';

const RANK_NAMES: Record<string, string> = {
  iron: '铁器', bronze: '青铜', silver: '白银',
  gold: '黄金', platinum: '铂金', diamond: '钻石',
  master: '大师', grandmaster: '宗师'
};

const FALLBACK_AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=a1&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=b2&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=c3&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=d4&backgroundColor=d1f4d1',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=e5&backgroundColor=ffeaa7',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=f6&backgroundColor=74b9ff',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=g7&backgroundColor=a29bfe',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=h8&backgroundColor=fd79a8',
];

export interface Opponent {
  id?: number;
  nickname: string;
  avatar: string;
  rankTier: string;
  rankLabel: string;
  rating: number;
}

let cachedOpponents: Opponent[] = [];
let lastFetchTime = 0;
const CACHE_TTL = 120000;

async function fetchRealOpponents(): Promise<Opponent[]> {
  const myId = useAuthStore.getState().user?.id;

  try {
    const res = await gameApi.getRandomOpponent();
    if (res.code === 200 && res.data) {
      const user = res.data;
      return [{
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar || '',
        rankTier: user.rankTier || 'iron',
        rankLabel: RANK_NAMES[user.rankTier] || '铁器',
        rating: user.rating || 1000,
      }];
    }
  } catch (err) {
    const status = err?.response?.status;
    if (status !== 404) {
      console.warn('[Matchmaking] 获取真实对手失败:', status || err.message);
    }
  }

  try {
    const { userApi } = await import('../../../api/user');
    const res = await userApi.searchUsers('');
    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
      const others = res.data.filter((u: any) => u.id !== myId);
      if (others.length > 0) {
        const user = others[Math.floor(Math.random() * others.length)];
        return [{
          id: user.id,
          nickname: user.nickname || user.username || '玩家',
          avatar: user.avatar || '',
          rankTier: 'bronze',
          rankLabel: '青铜',
          rating: 800 + Math.floor(Math.random() * 400),
        }];
      }
    }
  } catch (err: any) {
    console.warn('[Matchmaking] 搜索用户获取对手失败:', err.message);
  }

  return [];
}

export async function generateOpponent(playerRating: number = 1000): Promise<Opponent> {
  const now = Date.now();
  if (cachedOpponents.length === 0 || now - lastFetchTime > CACHE_TTL) {
    const fresh = await fetchRealOpponents();
    if (fresh.length > 0) {
      cachedOpponents = fresh;
      lastFetchTime = now;
    }
  }

  let opponent: Opponent;

  if (cachedOpponents.length > 0) {
    opponent = cachedOpponents[Math.floor(Math.random() * cachedOpponents.length)];
    const ratingVariance = Math.floor(Math.random() * 201) - 100;
    opponent = {
      ...opponent,
      rating: Math.max(800, playerRating + ratingVariance),
    };
  } else {
    const SURNAMES = ['王','李','张','刘','陈','杨','黄','赵','周','吴','徐','孙','马'];
    const NAMES = ['伟','强','磊','军','勇','杰','涛','明','超','华','芳','娜','敏','静','丽'];
    const surname = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
    const givenName = NAMES[Math.floor(Math.random() * NAMES.length)];
    const ratingVariance = Math.floor(Math.random() * 201) - 80;

    opponent = {
      nickname: `${surname}${givenName}`,
      avatar: FALLBACK_AVATARS[Math.floor(Math.random() * FALLBACK_AVATARS.length)],
      rankTier: 'bronze',
      rankLabel: '青铜',
      rating: Math.max(800, playerRating + ratingVariance),
    };
  }

  return opponent;
}

export type GameType = 'tictactoe' | 'gomoku' | 'chinese_chess' | 'go';

const GAME_TIME_RANGE: Record<GameType, { minSec: number; maxSec: number }> = {
  tictactoe: { minSec: 2, maxSec: 5 },
  gomoku: { minSec: 3, maxSec: 8 },
  chinese_chess: { minSec: 3, maxSec: 7 },
  go: { minSec: 5, maxSec: 15 },
};

interface DifficultyState {
  consecutiveWins: number;
  consecutiveLosses: number;
  totalGames: number;
  currentLevel: number;
}

const DIFFICULTY_CONFIG = {
  adjustmentSpeed: 0.05,
};

let state: DifficultyState = {
  consecutiveWins: 0,
  consecutiveLosses: 0,
  totalGames: 0,
  currentLevel: 0.5,
};

export function getDynamicDifficulty(gameType: GameType, moveCount: number = 0): {
  thinkTime: number;
} {
  const range = GAME_TIME_RANGE[gameType];

  const progressRatio = Math.min(moveCount / 20, 1);
  const adjustedMin = range.minSec + (range.maxSec - range.minSec) * progressRatio * 0.6;

  const thinkTime = Math.round(
    (adjustedMin + Math.random() * (range.maxSec - adjustedMin)) * 1000
  );

  return { thinkTime };
}

export function getThinkingPhases(thinkTime: number): { phase: string; delay: number; progress: number }[] {
  const phases: { phase: string; delay: number; progress: number }[] = [];
  const totalDuration = thinkTime + Math.random() * 500;
  
  phases.push({ phase: 'analyzing', delay: Math.round(totalDuration * 0.15), progress: 15 });
  phases.push({ phase: 'evaluating', delay: Math.round(totalDuration * 0.35), progress: 50 });
  phases.push({ phase: 'deciding', delay: Math.round(totalDuration * 0.35), progress: 85 });
  phases.push({ phase: 'ready', delay: Math.round(totalDuration * 0.15), progress: 100 });
  
  return phases;
}

export function recordGameResult(won: boolean): void {
  state.totalGames++;

  if (won) {
    state.consecutiveWins++;
    state.consecutiveLosses = 0;

    const winBonus = Math.min(state.consecutiveWins * 0.08, 0.25);
    state.currentLevel = Math.min(
      1,
      state.currentLevel + DIFFICULTY_CONFIG.adjustmentSpeed + winBonus
    );
  } else {
    state.consecutiveLosses++;
    state.consecutiveWins = 0;

    const lossPenalty = Math.min(state.consecutiveLosses * 0.06, 0.2);
    state.currentLevel = Math.max(
      0,
      state.currentLevel - DIFFICULTY_CONFIG.adjustmentSpeed - lossPenalty
    );
  }
}

export function resetDifficulty(): void {
  state = {
    currentLevel: 0.5,
    consecutiveWins: 0,
    consecutiveLosses: 0,
    totalGames: 0,
  };
}

export function getDifficultyState(): Readonly<DifficultyState> {
  return { ...state };
}
