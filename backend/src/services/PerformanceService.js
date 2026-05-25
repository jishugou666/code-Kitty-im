import { query } from '../utils/db.js';

const GAME_DIFFICULTY = {
  tictactoe: { coeff: 0.4, label: '井字棋', baseScore: 30 },
  gomoku: { coeff: 0.85, label: '五子棋', baseScore: 35 },
  chess: { coeff: 1.2, label: '中国象棋', baseScore: 40 }
};

const AI_STRENGTH = {
  easy: 0.5,
  medium: 1.0,
  hard: 1.4
};

function getOpponentStrengthCoeff(opponentRating, playerRating) {
  if (!opponentRating || !playerRating) return 1.0;
  const diff = opponentRating - playerRating;
  if (diff > 500) return 1.5;
  if (diff > 200) return 1.3;
  if (diff >= -200) return 1.0;
  if (diff >= -500) return 0.8;
  return 0.6;
}

const HIGHLIGHT_CONFIG = {
  speed_demon: { icon: '⚡', name: '闪电战', desc: '极速获胜', bonus: 0.12 },
  perfect_game: { icon: '👑', name: '完美对局', desc: '无懈可击的表现', bonus: 0.15 },
  iron_wall: { icon: '🛡️', name: '铜墙铁壁', desc: '滴水不漏的防守', bonus: 0.10 },
  comeback: { icon: '🔄', name: '绝地反击', desc: '逆风翻盘', bonus: 0.15 },
  win_streak: { icon: '🔥', name: '连胜加持', desc: '势不可挡', bonus: 0.08 },
  center_control: { icon: '🎯', name: '中心统治', desc: '掌控全局', bonus: 0.05 },
  chain_master: { icon: '💎', name: '连珠大师', desc: '精妙棋形制胜', bonus: 0.12 },
  sacrifice_attack: { icon: '🗡️', name: '弃子攻杀', desc: '舍卒保车', bonus: 0.14 },
  checkmate: { icon: '♟️', name: '将军', desc: '将死对手', bonus: 0.15 },
  brilliant_finish: { icon: '🎯', name: '绝杀', desc: '精彩收官', bonus: 0.10 },
  underdog_win: { icon: '🏆', name: '以弱胜强', desc: '击败更强对手', bonus: 0.12 },
  first_blood: { icon: '🎮', name: '首战告捷', desc: '本场首胜', bonus: 0.05 }
};

const GRADE_CONFIG = [
  { min: 90, grade: 'S', label: '超凡入圣', color: '#FF6B6B', bgGradient: 'from-red-500 via-orange-500 to-yellow-500' },
  { min: 75, grade: 'A', label: '技惊四座', color: '#A855F7', bgGradient: 'from-purple-500 to-pink-500' },
  { min: 60, grade: 'B', label: '可圈可点', color: '#3B82F6', bgGradient: 'from-blue-500 to-cyan-500' },
  { min: 40, grade: 'C', label: '初露锋芒', color: '#22C55E', bgGradient: 'from-green-500 to-emerald-500' },
  { min: 0, grade: 'D', label: '继续努力', color: '#9CA3AF', bgGradient: 'from-gray-400 to-gray-500' }
];

const GAME_TITLES = {
  tictactoe: {
    S: ['三子之神', '井字棋圣', '完美棋手'],
    A: ['战术大师', '布局专家', '速胜达人'],
    B: ['稳健选手', '步步为营', '渐入佳境'],
    C: ['初学者', '潜力新人', '蓄势待发'],
    D: ['新手入门', '继续加油', '重在参与']
  },
  gomoku: {
    S: ['五珠至尊', '连珠棋圣', '神之一手'],
    A: ['布局大师', '攻守兼备', '运筹帷幄'],
    B: ['稳扎稳打', '思路清晰', '有条不紊'],
    C: ['五子新手', '初窥门径', '日积月累'],
    D: ['刚上路', '多加练习', '别灰心']
  },
  chess: {
    S: ['象棋宗师', '国手风范', '天下无双'],
    A: ['棋坛精英', '用兵如神', '深谋远虑'],
    B: ['中规中矩', '沉着冷静', '有板有眼'],
    C: ['楚汉初学', '略懂皮毛', '马步扎实'],
    D: ['刚摸棋子', '观棋不语', '路漫漫兮']
  }
};

function analyzeTicTacToePerformance(matchData, won) {
  const bonuses = [];
  const highlights = [];
  const moves = matchData.moves || [];
  const moveCount = moves.length;

  if (won && moveCount <= 5) {
    bonuses.push({ key: 'speed', value: 0.20, label: '闪电获胜(≤5步)' });
    highlights.push('speed_demon');
  } else if (won && moveCount <= 7) {
    bonuses.push({ key: 'speed', value: 0.10, label: '快速获胜(6-7步)' });
  }

  if (won && moveCount <= 5) {
    bonuses.push({ key: 'perfect', value: 0.15, label: '完美对局' });
    highlights.push('perfect_game');
  }

  if (won) {
    const playerMoves = moves.filter((m, i) => i % 2 === 0);
    const centerMoves = playerMoves.filter(m => {
      const pos = m.position;
      return pos && ((Array.isArray(pos) && pos[0] === 1 && pos[1] === 1) ||
        (typeof pos === 'number' && pos === 4));
    });
    if (centerMoves.length >= 1) {
      bonuses.push({ key: 'center', value: 0.05, label: '中心控制' });
      highlights.push('center_control');
    }
  }

  return { bonuses, highlights };
}

function analyzeGomokuPerformance(matchData, won) {
  const bonuses = [];
  const highlights = [];
  const moves = matchData.moves || [];
  const moveCount = moves.length;

  if (won) {
    if (moveCount <= 15) {
      bonuses.push({ key: 'speed', value: 0.15, label: '速胜(≤15步)' });
      highlights.push('speed_demon');
    } else if (moveCount <= 25) {
      bonuses.push({ key: 'speed', value: 0.08, label: '较快获胜(16-25步)' });
    } else if (moveCount <= 35) {
      bonuses.push({ key: 'speed', value: 0.03, label: '正常发挥(26-35步)' });
    }

    if (moveCount <= 20) {
      bonuses.push({ key: 'pattern', value: 0.12, label: '精妙棋形' });
      highlights.push('chain_master');
    }

    const playerMoveCount = Math.ceil(moveCount / 2);
    if (playerMoveCount >= 8) {
      bonuses.push({ key: 'endurance', value: 0.06, label: '持久战能力' });
    }
  }

  return { bonuses, highlights };
}

function analyzeChessPerformance(matchData, won) {
  const bonuses = [];
  const highlights = [];
  const moves = matchData.moves || [];
  const moveCount = moves.length;
  const duration = matchData.durationSeconds || 0;

  if (won) {
    highlights.push('checkmate');
    bonuses.push({ key: 'checkmate', value: 0.15, label: '将死对手' });

    if (moveCount <= 20) {
      bonuses.push({ key: 'quick_kill', value: 0.08, label: '速胜(≤20回合)' });
      highlights.push('brilliant_finish');
    } else if (moveCount <= 35) {
      bonuses.push({ key: 'normal_win', value: 0.04, label: '正常取胜' });
    }

    if (duration > 0 && duration <= 300) {
      bonuses.push({ key: 'time_efficiency', value: 0.10, label: '高效对局(<5分钟)' });
    } else if (duration > 0 && duration <= 600) {
      bonuses.push({ key: 'time_efficiency', value: 0.05, label: '较好效率(5-10分钟)' });
    }

    if (moveCount >= 15) {
      bonuses.push({ key: 'sacrifice', value: 0.10, label: '战术深度' });
      highlights.push('sacrifice_attack');
    }
  }

  return { bonuses, highlights };
}

export const PerformanceService = {
  calculatePerformance(matchData) {
    try {
      const {
        gameType,
        won,
        aiDifficulty,
        opponentRating,
        playerRating,
        currentWinStreak = 0,
        isFirstGame = false,
        moves = [],
        durationSeconds = 0
      } = matchData;

      const gameConfig = GAME_DIFFICULTY[gameType];
      if (!gameConfig) return this.getDefaultResult();

      const baseScore = gameConfig.baseScore;
      const difficultyCoeff = gameConfig.coeff;

      let strengthCoeff = 1.0;
      if (aiDifficulty) {
        strengthCoeff = AI_STRENGTH[aiDifficulty] || 1.0;
      } else if (opponentRating && playerRating) {
        strengthCoeff = getOpponentStrengthCoeff(opponentRating, playerRating);
        if (won && opponentRating > playerRating + 200) {
          matchData._highlights = matchData._highlights || [];
          matchData._highlights.push('underdog_win');
        }
      }

      let analysis = { bonuses: [], highlights: [] };
      if (gameType === 'tictactoe') {
        analysis = analyzeTicTacToePerformance(matchData, won);
      } else if (gameType === 'gomoku') {
        analysis = analyzeGomokuPerformance(matchData, won);
      } else if (gameType === 'chess') {
        analysis = analyzeChessPerformance(matchData, won);
      }

      let allHighlights = [...analysis.highlights];

      if (won && currentWinStreak >= 3) {
        allHighlights.push('win_streak');
        analysis.bonuses.push({ key: 'streak', value: 0.08, label: `连胜加持(${currentWinStreak}连胜)` });
      }

      if (won && isFirstGame) {
        allHighlights.push('first_blood');
        analysis.bonuses.push({ key: 'first', value: 0.05, label: '首战告捷' });
      }

      const uniqueHighlights = [...new Set(allHighlights)];

      let perfBonus = 0;
      for (const b of analysis.bonuses) {
        perfBonus += b.value;
      }

      let highlightBonus = 0;
      for (const h of uniqueHighlights) {
        const cfg = HIGHLIGHT_CONFIG[h];
        if (cfg) highlightBonus += cfg.bonus;
      }

      const rawScore = baseScore * difficultyCoeff * strengthCoeff *
        (1 + Math.min(perfBonus, 0.6)) * (1 + Math.min(highlightBonus, 0.5));

      const resultMultiplier = won ? 1.0 : -0.5;
      const finalScore = Math.max(0, Math.min(100, Math.round(rawScore)));

      const gradeInfo = GRADE_CONFIG.find(g => finalScore >= g.min) || GRADE_CONFIG[GRADE_CONFIG.length - 1];
      const titles = GAME_TITLES[gameType]?.[gradeInfo.grade] || ['表现良好'];
      const title = titles[Math.floor(Math.random() * titles.length)];

      const highlightDetails = uniqueHighlights.map(h => {
        const cfg = HIGHLIGHT_CONFIG[h];
        return cfg ? { key: h, ...cfg } : null;
      }).filter(Boolean);

      return {
        score: finalScore,
        grade: gradeInfo.grade,
        gradeLabel: gradeInfo.label,
        gradeColor: gradeInfo.color,
        bgGradient: gradeInfo.bgGradient,
        title,
        ratingChange: Math.round(finalScore * resultMultiplier * difficultyCoeff * 10) / 10,
        rawRatingChange: Math.round(finalScore * resultMultiplier),
        difficultyCoeff,
        strengthCoeff,
        performanceBonuses: analysis.bonuses,
        highlights: highlightDetails,
        breakdown: {
          baseScore,
          difficultyCoeff,
          strengthCoeff,
          perfBonus: Math.round(perfBonus * 100) / 100,
          highlightBonus: Math.round(highlightBonus * 100) / 100,
          resultMultiplier,
          finalScore
        }
      };
    } catch (e) {
      console.error('calculatePerformance error:', e);
      return this.getDefaultResult();
    }
  },

  getDefaultResult() {
    return {
      score: 50,
      grade: 'C',
      gradeLabel: '初露锋芒',
      gradeColor: '#22C55E',
      bgGradient: 'from-green-500 to-emerald-500',
      title: '表现一般',
      ratingChange: 0,
      rawRatingChange: 0,
      difficultyCoeff: 1.0,
      strengthCoeff: 1.0,
      performanceBonuses: [],
      highlights: [],
      breakdown: {}
    };
  },

  async savePerformanceResult(matchId, performanceResult) {
    try {
      await query(
        `UPDATE game_match SET 
         performance_score = ?, performance_grade = ?, 
         performance_title = ?, highlights = ?, 
         performance_details = ?
         WHERE id = ?`,
        [
          performanceResult.score,
          performanceResult.grade,
          performanceResult.title,
          JSON.stringify(performanceResult.highlights.map(h => h.key)),
          JSON.stringify(performanceResult.breakdown),
          matchId
        ]
      );
      return true;
    } catch (e) {
      console.error('savePerformanceResult error:', e);
      return false;
    }
  }
};
