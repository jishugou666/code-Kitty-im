import { query } from '../utils/db.js';

export const RankingService = {
  RANK_TIERS: [
    { tier: 'iron', min: 0, name: '铁器', color: '#8B4513' },
    { tier: 'bronze', min: 400, name: '青铜', color: '#CD7F32' },
    { tier: 'silver', min: 1000, name: '白银', color: '#C0C0C0' },
    { tier: 'gold', min: 1800, name: '黄金', color: '#FFD700' },
    { tier: 'platinum', min: 2700, name: '铂金', color: '#E5E4E2' },
    { tier: 'emerald', min: 3700, name: '翡翠', color: '#50C878' },
    { tier: 'diamond', min: 4700, name: '钻石', color: '#B9F2FF' },
    { tier: 'master', min: 6000, name: '大师', color: '#FF6B6B' }
  ],

  SCORE_MAP: {
    gomoku: { win: 25, loss: -15 },
    tictactoe: { win: 10, loss: -5 },
    chess: { win: 40, loss: -20 },
    go: { win: 30, loss: -18 }
  },

  AI_MULTIPLIER: {
    easy: 0.5,
    medium: 1.0,
    hard: 1.5
  },

  getTierFromRating(rating) {
    try {
      let result = this.RANK_TIERS[0];
      for (let i = this.RANK_TIERS.length - 1; i >= 0; i--) {
        if (rating >= this.RANK_TIERS[i].min) {
          result = this.RANK_TIERS[i];
          break;
        }
      }
      return { ...result };
    } catch (e) {
      return { ...this.RANK_TIERS[0] };
    }
  },

  calculateRatingChange(gameType, won, currentRating, aiDifficulty, opponentRating, performanceRatingChange) {
    try {
      let baseScore;

      if (typeof performanceRatingChange === 'number' && !isNaN(performanceRatingChange)) {
        baseScore = performanceRatingChange;
      } else {
        const scoreConfig = this.SCORE_MAP[gameType];
        if (!scoreConfig) return { change: 0, newRating: currentRating, newTier: this.getTierFromRating(currentRating) };

        baseScore = won ? scoreConfig.win : scoreConfig.loss;

        if (aiDifficulty) {
          const multiplier = this.AI_MULTIPLIER[aiDifficulty] || 1.0;
          baseScore = Math.round(baseScore * multiplier);
        }
      }

      const newRating = Math.max(0, currentRating + baseScore);
      return {
        change: baseScore,
        newRating,
        newTier: this.getTierFromRating(newRating),
        performanceRatingChange: typeof performanceRatingChange === 'number' ? performanceRatingChange : undefined
      };
    } catch (e) {
      return { change: 0, newRating: currentRating, newTier: this.getTierFromRating(currentRating), performanceRatingChange: undefined };
    }
  },

  async getOrCreateProfile(userId) {
    try {
      const profiles = await query(
        'SELECT * FROM user_game_profile WHERE user_id = ?',
        [userId]
      );

      if (profiles.length > 0) {
        return profiles[0];
      }

      await query(
        `INSERT INTO user_game_profile (user_id, total_games, wins, losses, draws, rating, peak_rating, rank_tier) 
         VALUES (?, 0, 0, 0, 0, 1000, 1000, 'iron')`,
        [userId]
      );

      const newProfiles = await query(
        'SELECT * FROM user_game_profile WHERE user_id = ?',
        [userId]
      );
      return newProfiles[0];
    } catch (e) {
      console.error('getOrCreateProfile error:', e);
      throw e;
    }
  },

  async updateProfileAfterGame(userId, gameType, won, aiDifficulty, performanceRatingChange) {
    try {
      const profile = await this.getOrCreateProfile(userId);

      const ratingResult = this.calculateRatingChange(
        gameType,
        won,
        profile.rating,
        aiDifficulty,
        null,
        performanceRatingChange
      );

      const totalGames = profile.total_games + 1;
      let wins = profile.wins;
      let losses = profile.losses;
      let draws = profile.draws;
      let currentWinStreak = profile.current_win_streak;
      let bestWinStreak = profile.best_win_streak;

      if (won) {
        wins += 1;
        currentWinStreak += 1;
        if (currentWinStreak > bestWinStreak) {
          bestWinStreak = currentWinStreak;
        }
      } else {
        losses += 1;
        currentWinStreak = 0;
      }

      const gameTypeWinsField = `${gameType}_wins`;
      const gameTypeLossesField = `${gameType}_losses`;

      await query(
        `UPDATE user_game_profile SET 
         total_games = ?, wins = ?, losses = ?, draws = ?,
         rating = ?, peak_rating = GREATEST(peak_rating, ?), rank_tier = ?,
         ${gameTypeWinsField} = ${gameTypeWinsField} + 1,
         ${gameTypeLossesField} = ${gameTypeLossesField} + ?,
         current_win_streak = ?, best_win_streak = GREATEST(best_win_streak, ?)
         WHERE user_id = ?`,
        [
          totalGames, wins, losses, draws,
          ratingResult.newRating, ratingResult.newRating, ratingResult.newTier.tier,
          won ? 1 : 0,
          currentWinStreak, bestWinStreak,
          userId
        ]
      );

      return this.getOrCreateProfile(userId);
    } catch (e) {
      console.error('updateProfileAfterGame error:', e);
      throw e;
    }
  },

  async getLeaderboard(limit = 50, gameType = null) {
    try {
      let sql = `
        SELECT ugp.*, u.nickname, u.avatar 
        FROM user_game_profile ugp
        LEFT JOIN user u ON ugp.user_id = u.id
        WHERE ugp.total_games > 0
      `;
      const params = [];

      if (gameType) {
        sql += ` AND (${gameType}_wins + ${gameType}_losses) > 0`;
      }

      sql += ` ORDER BY ugp.rating DESC LIMIT ${parseInt(limit)}`;

      const results = await query(sql, params);
      return results.map((row, index) => ({
        rank: index + 1,
        ...row,
        win_rate: row.total_games > 0 ? row.wins / row.total_games : 0,
        tierInfo: this.getTierFromRating(row.rating)
      }));
    } catch (e) {
      console.error('getLeaderboard error:', e);
      return [];
    }
  },

  async getUserProfile(userId) {
    try {
      const profile = await this.getOrCreateProfile(userId);

      const users = await query(
        'SELECT id, nickname, avatar FROM user WHERE id = ?',
        [userId]
      );
      const user = users[0] || {};

      return {
        ...profile,
        nickname: user.nickname,
        avatar: user.avatar,
        tierInfo: this.getTierFromRating(profile.rating),
        winRate: profile.total_games > 0 
          ? Math.round((profile.wins / profile.total_games) * 100) 
          : 0
      };
    } catch (e) {
      console.error('getUserProfile error:', e);
      throw e;
    }
  }
};
