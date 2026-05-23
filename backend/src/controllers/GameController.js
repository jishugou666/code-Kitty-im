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
  }
};
