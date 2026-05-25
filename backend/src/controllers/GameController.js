import { query } from '../utils/db.js';
import { GameService } from '../services/GameService.js';
import { RankingService } from '../services/RankingService.js';
import { success, error, validationError } from '../utils/response.js';

export const GameController = {
  async createMatch(req, res, next) {
    try {
      const { gameType, mode, aiDifficulty } = req.body;

      if (!gameType) {
        return res.status(400).json(validationError('请选择游戏类型'));
      }

      const validTypes = ['gomoku', 'tictactoe', 'chess'];
      if (!validTypes.includes(gameType)) {
        return res.status(400).json(validationError('无效的游戏类型'));
      }

      const match = await GameService.createMatch(
        req.user.id,
        gameType,
        mode || 'ai',
        aiDifficulty || 'medium'
      );

      res.status(201).json(success(match, '对局已创建'));
    } catch (err) {
      if (err.message === 'You have an active match already') {
        return res.status(409).json(error('您已有进行中的对局', 409));
      }
      if (err.message === 'Invalid game type' || err.message === 'Invalid game mode' || err.message === 'Invalid AI difficulty') {
        return res.status(400).json(validationError(err.message));
      }
      next(err);
    }
  },

  async move(req, res, next) {
    try {
      const { matchId } = req.params;
      const { position, symbol } = req.body;

      if (!position || symbol === undefined) {
        return res.status(400).json(validationError('缺少落子位置或棋子符号'));
      }

      const result = await GameService.recordMove(matchId, position, symbol);
      res.json(success(result, '落子成功'));
    } catch (err) {
      if (err.message === 'Match not found') {
        return res.status(404).json(error('对局不存在', 404));
      }
      if (err.message === 'Match is not in playing state') {
        return res.status(400).json(error('对局未在进行中', 400));
      }
      next(err);
    }
  },

  async surrender(req, res, next) {
    try {
      const { matchId } = req.params;
      const match = await GameService.abandonMatch(matchId);
      res.json(success(match, '已认输'));
    } catch (err) {
      if (err.message === 'Match not found') {
        return res.status(404).json(error('对局不存在', 404));
      }
      if (err.message === 'Match is already finished') {
        return res.status(400).json(error('对局已结束', 400));
      }
      next(err);
    }
  },

  async finish(req, res, next) {
    try {
      const { matchId } = req.params;
      const { won, status = 'finished' } = req.body;
      
      // 先获取对局信息
      const matches = await query(
        'SELECT id, player1_id, status FROM game_match WHERE id = ?',
        [matchId]
      );
      if (matches.length === 0) {
        return res.status(404).json(error('对局不存在', 404));
      }
      const match = matches[0];
      if (match.status !== 'playing') {
        return res.status(400).json(error('对局已结束', 400));
      }
      
      // 计算 winnerId
      let winnerId = null;
      if (status === 'finished' && won !== undefined) {
        winnerId = won ? req.user.id : null;
      }
      
      const updatedMatch = await GameService.finishMatch(matchId, winnerId, status);
      res.json(success(updatedMatch, '对局已结束'));
    } catch (err) {
      if (err.message === 'Match not found') {
        return res.status(404).json(error('对局不存在', 404));
      }
      if (err.message === 'Match is already finished') {
        return res.status(400).json(error('对局已结束', 400));
      }
      next(err);
    }
  },

  async getProfile(req, res, next) {
    try {
      const profile = await RankingService.getUserProfile(req.user.id);
      res.json(success(profile));
    } catch (err) {
      next(err);
    }
  },

  async getLeaderboard(req, res, next) {
    try {
      const { gameType, limit } = req.query;
      const leaderboard = await RankingService.getLeaderboard(
        limit ? parseInt(limit) : 50,
        gameType || null
      );
      res.json(success(leaderboard));
    } catch (err) {
      next(err);
    }
  },

  async getHistory(req, res, next) {
    try {
      const { limit } = req.query;
      const history = await GameService.getMatchHistory(
        req.user.id,
        limit ? parseInt(limit) : 20
      );
      res.json(success(history));
    } catch (err) {
      next(err);
    }
  },

  async heartbeat(req, res, next) {
    try {
      const { matchId } = req.params;
      await GameService.updateHeartbeat(matchId, req.user.id);
      res.json(success(null, '心跳更新'));
    } catch (err) {
      if (err.message === 'Match not found') {
        return res.status(404).json(error('对局不存在', 404));
      }
      next(err);
    }
  },

  async checkAbandonedMatches(req, res, next) {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json(error('无权限', 403));
      }
      const count = await GameService.finishAbandonedMatches();
      res.json(success({ abandonedCount: count }, `已处理 ${count} 个逃跑对局`));
    } catch (err) {
      next(err);
    }
  },

  async getRandomOpponent(req, res, next) {
    try {
      const { excludeId } = req.query;
      const opponent = await GameService.getRandomOpponent(
        req.user.id,
        excludeId ? parseInt(excludeId) : undefined
      );
      if (!opponent) {
        return res.status(404).json(error('暂无可用对手', 404));
      }
      res.json(success(opponent));
    } catch (err) {
      next(err);
    }
  },

  async invite(req, res) {
    try {
      const { opponentId, gameType } = req.body;
      const inviterId = req.user.id;

      if (!opponentId || !gameType) {
        res.json({ code: 400, data: null, msg: '缺少必要参数' });
        return;
      }

      const match = await GameService.createInvite(inviterId, opponentId, gameType);

      const inviterProfile = await query('SELECT nickname FROM user WHERE id = ?', [inviterId]);
      const inviterName = inviterProfile.length > 0 ? inviterProfile[0].nickname : '对方';

      try {
        const { sendToUser } = await import('../utils/websocket.js');
        sendToUser(Number(opponentId), JSON.stringify({
          type: 'game_invite',
          data: {
            matchId: match.id,
            gameType,
            inviterId,
            inviterName
          }
        }));
      } catch (wsErr) {
        console.log('[Game] WS通知发送失败(用户可能离线):', wsErr.message);
      }

      res.json({ code: 200, data: match, msg: '邀请已发送' });
    } catch (error) {
      console.error('Invite error:', error);
      res.json({ code: 500, data: null, msg: error.message });
    }
  },

  async respondInvite(req, res) {
    try {
      const { matchId, accepted } = req.body;
      const userId = req.user.id;

      if (!matchId || typeof accepted !== 'boolean') {
        res.json({ code: 400, data: null, msg: '缺少必要参数' });
        return;
      }

      const result = await GameService.respondInvite(matchId, userId, accepted);

      if (!result.success) {
        res.json({ code: 400, data: null, msg: result.error });
        return;
      }

      if (result.rejected) {
        try {
          const matchInfo = await query('SELECT player1_id FROM game_match WHERE id = ?', [matchId]);
          if (matchInfo.length > 0) {
            const { sendToUser } = await import('../utils/websocket.js');
            sendToUser(matchInfo[0].player1_id, JSON.stringify({
              type: 'game_invite_rejected',
              data: { matchId }
            }));
          }
        } catch {}
        res.json({ code: 200, data: { rejected: true }, msg: '已拒绝邀请' });
        return;
      }

      try {
        const { sendToUser } = await import('../utils/websocket.js');
        sendToUser(result.match.player1_id, JSON.stringify({
          type: 'game_invite_accepted',
          data: { matchId: result.match.id, gameType: result.match.game_type }
        }));
      } catch {}

      res.json({ code: 200, data: result.match, msg: '接受成功，即将开始对局' });
    } catch (error) {
      console.error('Respond invite error:', error);
      res.json({ code: 500, data: null, msg: error.message });
    }
  }
};
