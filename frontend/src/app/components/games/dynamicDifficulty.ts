import { gameApi } from '../../../api/game';

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
  try {
    const res = await gameApi.getRandomOpponent();
    if (res.code === 200 && res.data) {
      const user = res.data;
      return [{
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar || FALLBACK_AVATARS[Math.floor(Math.random() * FALLBACK_AVATARS.length)],
        rankTier: user.rankTier || 'iron',
        rankLabel: RANK_NAMES[user.rankTier] || '铁器',
        rating: user.rating || 1000,
      }];
    }
  } catch (err) {
    console.warn('[Matchmaking] 获取真实对手失败，使用缓存:', err.message);
  }
  return cachedOpponents.length > 0 ? cachedOpponents : [];
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

interface DifficultyState {
  currentLevel: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  totalGames: number;
}

const DIFFICULTY_CONFIG = {
  minThinkTime: 800,
  maxThinkTime: 3500,
  minErrorRate: 0.02,
  maxErrorRate: 0.30,
  adjustmentSpeed: 0.12,
};

let state: DifficultyState = {
  currentLevel: 0.5,
  consecutiveWins: 0,
  consecutiveLosses: 0,
  totalGames: 0,
};

export function getDynamicDifficulty(): {
  level: number;
  thinkTime: number;
  errorRate: number;
} {
  const level = state.currentLevel;
  
  const baseThinkTime = DIFFICULTY_CONFIG.minThinkTime +
    (DIFFICULTY_CONFIG.maxThinkTime - DIFFICULTY_CONFIG.minThinkTime) * level;
  
  const randomVariance = (Math.random() - 0.5) * baseThinkTime * 0.6;
  const thinkTime = Math.round(Math.max(600, baseThinkTime + randomVariance));
  
  const errorRate =
    DIFFICULTY_CONFIG.maxErrorRate -
      (DIFFICULTY_CONFIG.maxErrorRate - DIFFICULTY_CONFIG.minErrorRate) * level;

  return { level, thinkTime, errorRate };
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
