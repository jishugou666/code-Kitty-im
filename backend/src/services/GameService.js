import { query } from '../utils/db.js';
import { RankingService } from './RankingService.js';
import { PerformanceService } from './PerformanceService.js';

export const GameService = {
  async createMatch(playerId, gameType, mode = 'ai', aiDifficulty = 'medium') {
    try {
      const validGameTypes = ['gomoku', 'tictactoe', 'chess'];
      const validModes = ['ai', 'pvp'];
      const validDifficulties = ['easy', 'medium', 'hard'];

      if (!validGameTypes.includes(gameType)) {
        throw new Error('Invalid game type');
      }
      if (!validModes.includes(mode)) {
        throw new Error('Invalid game mode');
      }
      if (!validDifficulties.includes(aiDifficulty)) {
        throw new Error('Invalid AI difficulty');
      }

      const activeMatches = await query(
        "SELECT id FROM game_match WHERE player1_id = ? AND status = 'playing'",
        [playerId]
      );
      if (activeMatches.length > 0) {
        await query(
          "UPDATE game_match SET status = 'abandoned', finished_at = NOW() WHERE player1_id = ? AND status = 'playing'",
          [playerId]
        );
      }

      const result = await query(
        `INSERT INTO game_match (game_type, mode, player1_id, ai_difficulty, moves, status) 
         VALUES (?, ?, ?, ?, '[]', 'playing')`,
        [gameType, mode, playerId, aiDifficulty]
      );

      const matches = await query(
        'SELECT id, game_type, mode, player1_id, player2_id, status, ai_difficulty, moves, created_at FROM game_match WHERE id = ?',
        [result.insertId]
      );
      return matches[0];
    } catch (e) {
      console.error('createMatch error:', e);
      throw e;
    }
  },

  async recordMove(matchId, position, symbol) {
    try {
      const matches = await query(
        'SELECT id, moves, status FROM game_match WHERE id = ?',
        [matchId]
      );
      if (matches.length === 0) {
        throw new Error('Match not found');
      }

      const match = matches[0];
      if (match.status !== 'playing') {
        throw new Error('Match is not in playing state');
      }

      let moves = [];
      if (match.moves) {
        try {
          moves = typeof match.moves === 'string' ? JSON.parse(match.moves) : match.moves;
        } catch (parseErr) {
          moves = [];
        }
      }

      moves.push({ position, symbol, timestamp: new Date().toISOString() });

      await query(
        'UPDATE game_match SET moves = ? WHERE id = ?',
        [JSON.stringify(moves), matchId]
      );

      return { matchId, moveCount: moves.length, lastMove: moves[moves.length - 1] };
    } catch (e) {
      console.error('recordMove error:', e);
      throw e;
    }
  },

  async finishMatch(matchId, winnerId = null, status = 'finished') {
    try {
      const matches = await query(
        'SELECT id, player1_id, player2_id, game_type, mode, ai_difficulty, status, created_at FROM game_match WHERE id = ?',
        [matchId]
      );
      if (matches.length === 0) {
        throw new Error('Match not found');
      }

      const match = matches[0];
      if (match.status !== 'playing') {
        throw new Error('Match is already finished');
      }

      const finishedAt = new Date();
      const createdAt = new Date(match.created_at);
      const durationSeconds = Math.round((finishedAt - createdAt) / 1000);

      let scoreChange = 0;
      if (winnerId && status === 'finished') {
        const won = winnerId === match.player1_id;

        const playerProfile = await query(
          'SELECT rating FROM user_game_profile WHERE user_id = ?',
          [match.player1_id]
        );
        const playerRating = playerProfile.length > 0 ? playerProfile[0].rating : 1000;

        const matchDataForPerf = {
          gameType: match.game_type,
          won: won,
          aiDifficulty: match.mode === 'ai' ? match.ai_difficulty : null,
          opponentRating: null,
          playerRating: playerRating,
          moves: [],
          durationSeconds: durationSeconds
        };

        const perfResult = PerformanceService.calculatePerformance(matchDataForPerf);

        const ratingResult = RankingService.calculateRatingChange(
          match.game_type,
          won,
          playerRating,
          match.mode === 'ai' ? match.ai_difficulty : null,
          perfResult.rawRatingChange
        );
        scoreChange = ratingResult.change;

        await RankingService.updateProfileAfterGame(
          match.player1_id,
          match.game_type,
          won,
          match.mode === 'ai' ? match.ai_difficulty : null,
          perfResult.rawRatingChange
        );

        await PerformanceService.savePerformanceResult(matchId, perfResult);

        if (match.player2_id && match.mode === 'pvp') {
          const player2Won = winnerId === match.player2_id;
          await RankingService.updateProfileAfterGame(
            match.player2_id,
            match.game_type,
            player2Won,
            null
          );
        }
      } else if (status === 'abandoned') {
        const playerProfile = await query(
          'SELECT rating FROM user_game_profile WHERE user_id = ?',
          [match.player1_id]
        );
        const playerRating = playerProfile.length > 0 ? playerProfile[0].rating : 1000;

        const matchDataForPerf = {
          gameType: match.game_type,
          won: false,
          aiDifficulty: match.mode === 'ai' ? match.ai_difficulty : null,
          opponentRating: null,
          playerRating: playerRating,
          moves: [],
          durationSeconds: durationSeconds
        };

        const perfResult = PerformanceService.calculatePerformance(matchDataForPerf);

        await RankingService.updateProfileAfterGame(
          match.player1_id,
          match.game_type,
          false,
          match.mode === 'ai' ? match.ai_difficulty : null,
          perfResult.rawRatingChange
        );

        await PerformanceService.savePerformanceResult(matchId, perfResult);
      }

      await query(
        `UPDATE game_match SET 
         winner_id = ?, status = ?, finished_at = ?, 
         duration_seconds = ?, score_change = ?
         WHERE id = ?`,
        [winnerId, status, finishedAt.toISOString().slice(0, 19).replace('T', ' '), durationSeconds, scoreChange, matchId]
      );

      const updatedMatches = await query(
        'SELECT * FROM game_match WHERE id = ?',
        [matchId]
      );
      return updatedMatches[0];
    } catch (e) {
      console.error('finishMatch error:', e);
      throw e;
    }
  },

  async abandonMatch(matchId) {
    try {
      return this.finishMatch(matchId, null, 'abandoned');
    } catch (e) {
      console.error('abandonMatch error:', e);
      throw e;
    }
  },

  async getMatchHistory(userId, limit = 20) {
    try {
      const safeLimit = parseInt(limit) || 20;
      const matches = await query(
        `SELECT gm.id, gm.game_type, gm.mode, gm.winner_id, gm.status, 
                gm.ai_difficulty, gm.duration_seconds, gm.score_change, 
                gm.created_at, gm.finished_at,
                u1.nickname as player1_nickname, u1.avatar as player1_avatar,
                u2.nickname as player2_nickname, u2.avatar as player2_avatar
         FROM game_match gm
         LEFT JOIN user u1 ON gm.player1_id = u1.id
         LEFT JOIN user u2 ON gm.player2_id = u2.id
         WHERE gm.player1_id = ? OR gm.player2_id = ?
         ORDER BY gm.created_at DESC LIMIT ${safeLimit}`,
        [userId, userId]
      );

      return matches.map(m => ({
        ...m,
        isWin: m.winner_id === userId,
        isDraw: m.status === 'finished' && !m.winner_id
      }));
    } catch (e) {
      console.error('getMatchHistory error:', e);
      return [];
    }
  },

  async getActiveMatch(userId) {
    try {
      const matches = await query(
        `SELECT gm.*, u.nickname as opponent_nickname, u.avatar as opponent_avatar
         FROM game_match gm
         LEFT JOIN user u ON (gm.player2_id = u.id OR (gm.mode = 'pvp' AND gm.player1_id != ? AND gm.player1_id = u.id))
         WHERE (gm.player1_id = ? OR gm.player2_id = ?) AND gm.status = 'playing'
         LIMIT 1`,
        [userId, userId, userId]
      );
      return matches.length > 0 ? matches[0] : null;
    } catch (e) {
      console.error('getActiveMatch error:', e);
      return null;
    }
  },

  async updateHeartbeat(matchId, userId) {
    try {
      const matches = await query(
        'SELECT id, player1_id, status FROM game_match WHERE id = ?',
        [matchId]
      );
      if (matches.length === 0) {
        throw new Error('Match not found');
      }
      const match = matches[0];
      if (match.player1_id !== userId) {
        throw new Error('Not your match');
      }
      if (match.status !== 'playing') {
        return;
      }

      await query(
        'UPDATE game_match SET last_heartbeat = NOW() WHERE id = ?',
        [matchId]
      );
    } catch (e) {
      console.error('updateHeartbeat error:', e);
      throw e;
    }
  },

  async finishAbandonedMatches() {
    try {
      const timeoutSeconds = 45;
      const matches = await query(
        `SELECT id, player1_id, game_type, mode, ai_difficulty 
         FROM game_match 
         WHERE status = 'playing' 
         AND (
           last_heartbeat IS NULL AND created_at < DATE_SUB(NOW(), INTERVAL ${timeoutSeconds + 15} SECOND)
           OR last_heartbeat IS NOT NULL AND last_heartbeat < DATE_SUB(NOW(), INTERVAL ${timeoutSeconds} SECOND)
         )`
      );

      let count = 0;
      for (const match of matches) {
        try {
          await this.finishMatch(match.id, null, 'abandoned');
          count++;
          console.log(`[GameMonitor] 对局 #${match.id} 逃跑判负 (玩家${match.player1_id})`);
        } catch (finishErr) {
          console.error(`[GameMonitor] 处理对局 #${match.id} 失败:`, finishErr.message);
        }
      }

      return count;
    } catch (e) {
      console.error('finishAbandonedMatches error:', e);
      return 0;
    }
  },

  async createInvite(inviterId, opponentId, gameType) {
    const validGameTypes = ['gomoku', 'tictactoe', 'chess'];
    if (!validGameTypes.includes(gameType)) {
      throw new Error('Invalid game type');
    }

    const result = await query(
      `INSERT INTO game_match (game_type, mode, player1_id, player2_id, ai_difficulty, moves, status)
       VALUES (?, 'pvp', ?, NULL, NULL, '[]', 'pending')`,
      [gameType, inviterId]
    );

    await query(
      "UPDATE game_match SET player2_id = ? WHERE id = ?",
      [opponentId, result.insertId]
    );

    const matches = await query(
      'SELECT * FROM game_match WHERE id = ?',
      [result.insertId]
    );
    return matches[0];
  },

  async respondInvite(matchId, userId, accepted) {
    const matches = await query(
      'SELECT id, player1_id, player2_id, status, game_type FROM game_match WHERE id = ?',
      [matchId]
    );
    if (matches.length === 0) {
      return { success: false, error: '对局不存在' };
    }
    
    const match = matches[0];
    if (match.status !== 'pending') {
      return { success: false, error: '该邀请已失效' };
    }
    if (String(match.player2_id) !== String(userId)) {
      return { success: false, error: '无权操作此邀请' };
    }

    if (accepted) {
      await query(
        "UPDATE game_match SET status = 'playing' WHERE id = ?",
        [matchId]
      );
      
      const updated = await query('SELECT * FROM game_match WHERE id = ?', [matchId]);
      return { success: true, match: updated[0] };
    } else {
      await query(
        "UPDATE game_match SET status = 'rejected', finished_at = NOW() WHERE id = ?",
        [matchId]
      );
      return { success: true, rejected: true, matchId };
    }
  },

  async getRandomOpponent(currentUserId, excludeId = null) {
    try {
      let excludeClause = 'WHERE u.id != ?';
      const params = [currentUserId];
      
      if (excludeId) {
        excludeClause += ' AND u.id != ?';
        params.push(excludeId);
      }

      const users = await query(
        `SELECT u.id, u.nickname, u.avatar, ugp.rating, ugp.rank_tier
         FROM user u
         LEFT JOIN user_game_profile ugp ON u.id = ugp.user_id
         ${excludeClause}
         ORDER BY RAND()
         LIMIT 1`,
        params
      );

      if (users.length === 0) return null;

      const user = users[0];
      const RANK_NAMES = {
        iron: '铁器', bronze: '青铜', silver: '白银',
        gold: '黄金', platinum: '铂金', diamond: '钻石',
        master: '大师', grandmaster: '宗师'
      };

      return {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar || null,
        rating: user.rating || 1000,
        rankTier: user.rank_tier || 'iron',
        rankLabel: RANK_NAMES[user.rank_tier] || '铁器'
      };
    } catch (e) {
      console.error('getRandomOpponent error:', e);
      return null;
    }
  }
};
