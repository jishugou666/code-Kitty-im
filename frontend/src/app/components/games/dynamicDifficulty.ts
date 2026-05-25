const SURNAMES = [
  '王', '李', '张', '刘', '陈', '杨', '黄', '赵', '周', '吴',
  '徐', '孙', '马', '朱', '胡', '郭', '何', '林', '罗', '高',
  '郑', '梁', '谢', '宋', '唐', '许', '邓', '冯', '韩', '曹',
  '曾', '彭', '萧', '蔡', '潘', '田', '董', '袁', '于', '余',
  '叶', '蒋', '杜', '苏', '魏', '程', '吕', '丁', '沈', '任'
];

const MALE_NAMES = [
  '伟', '强', '磊', '军', '勇', '杰', '涛', '明', '超', '华',
  '刚', '辉', '鹏', '斌', '波', '宇', '浩', '凯', '毅', '俊',
  '峰', '龙', '威', '志', '亮', '健', '林', '洋', '昊', '飞',
  '翔', '睿', '泽', '旭', '晨', '博', '天', '子', '轩', '然'
];

const FEMALE_NAMES = [
  '芳', '娜', '敏', '静', '丽', '婷', '雪', '艳', '玲', '燕',
  '萍', '红', '琳', '倩', '颖', '璐', '婷', '洁', '薇', '欣',
  '怡', '悦', '萱', '馨', '妍', '茜', '露', '琪', '瑶', '蕾',
  '涵', '彤', '嘉', '宁', '诗', '思', '雨', '梦', '柔', '晴'
];

const AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=1&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=2&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=3&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=4&backgroundColor=d1f4d1',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=5&backgroundColor=ffeaa7',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=6&backgroundColor=74b9ff',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=7&backgroundColor=a29bfe',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=8&backgroundColor=fd79a8',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=9&backgroundColor=55efc4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=10&backgroundColor=fab1a0',
];

const RANK_TITLES = ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster'];
const RANK_NAMES = ['铁器', '青铜', '白银', '黄金', '铂金', '钻石', '大师', '宗师'];

export interface Opponent {
  nickname: string;
  avatar: string;
  rankTier: string;
  rankLabel: string;
  rating: number;
}

export function generateOpponent(playerRating: number = 1000): Opponent {
  const isFemale = Math.random() > 0.55;
  const surname = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
  const namePool = isFemale ? FEMALE_NAMES : MALE_NAMES;
  const givenName = namePool[Math.floor(Math.random() * namePool.length)];
  
  const ratingVariance = Math.floor(Math.random() * 201) - 80;
  const opponentRating = Math.max(800, playerRating + ratingVariance);
  
  const tierIndex = Math.max(0, Math.min(7, Math.floor((opponentRating - 800) / 200)));
  
  return {
    nickname: `${surname}${givenName}`,
    avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
    rankTier: RANK_TITLES[tierIndex],
    rankLabel: RANK_NAMES[tierIndex],
    rating: opponentRating,
  };
}

interface DifficultyState {
  currentLevel: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  totalGames: number;
}

const DIFFICULTY_CONFIG = {
  minThinkTime: 400,
  maxThinkTime: 1400,
  minErrorRate: 0.02,
  maxErrorRate: 0.35,
  adjustmentSpeed: 0.15,
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
  const thinkTime = Math.round(
    DIFFICULTY_CONFIG.minThinkTime +
      (DIFFICULTY_CONFIG.maxThinkTime - DIFFICULTY_CONFIG.minThinkTime) * level
  );
  const errorRate =
    DIFFICULTY_CONFIG.maxErrorRate -
      (DIFFICULTY_CONFIG.maxErrorRate - DIFFICULTY_CONFIG.minErrorRate) * level;

  return { level, thinkTime, errorRate };
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
