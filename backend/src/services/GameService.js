import { query } from '../utils/db.js';
import { RankingService } from './RankingService.js';

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
        throw new Error('You have an active match already');
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
        const ratingResult = RankingService.calculateRatingChange(
          match.game_type,
          won,
          1000,
          match.mode === 'ai' ? match.ai_difficulty : null
        );
        scoreChange = ratingResult.change;

        await RankingService.updateProfileAfterGame(
          match.player1_id,
          match.game_type,
          won,
          match.mode === 'ai' ? match.ai_difficulty : null
        );

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
        await RankingService.updateProfileAfterGame(
          match.player1_id,
          match.game_type,
          false,
          match.mode === 'ai' ? match.ai_difficulty : null
        );
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
  }
};
