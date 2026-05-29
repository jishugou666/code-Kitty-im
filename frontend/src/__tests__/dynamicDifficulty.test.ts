// Mock the game API module to avoid import.meta.env issues
jest.mock('../api/game', () => ({
  gameApi: {
    getRandomOpponent: jest.fn(),
  },
}));

import {
  getDynamicDifficulty,
  getThinkingPhases,
  recordGameResult,
  resetDifficulty,
  getDifficultyState,
} from '../app/components/games/dynamicDifficulty';

describe('dynamicDifficulty', () => {
  beforeEach(() => {
    resetDifficulty();
  });

  describe('getDynamicDifficulty', () => {
    it('should return thinkTime within valid range for tictactoe', () => {
      const result = getDynamicDifficulty('tictactoe', 0);
      expect(result).toHaveProperty('thinkTime');
      expect(result.thinkTime).toBeGreaterThanOrEqual(2000);
      expect(result.thinkTime).toBeLessThanOrEqual(5000);
    });

    it('should return thinkTime within valid range for gomoku', () => {
      const result = getDynamicDifficulty('gomoku', 0);
      expect(result.thinkTime).toBeGreaterThanOrEqual(3000);
      expect(result.thinkTime).toBeLessThanOrEqual(8000);
    });

    it('should return thinkTime within valid range for chinese_chess', () => {
      const result = getDynamicDifficulty('chinese_chess', 0);
      expect(result.thinkTime).toBeGreaterThanOrEqual(3000);
      expect(result.thinkTime).toBeLessThanOrEqual(7000);
    });

    it('should return thinkTime within valid range for go', () => {
      const result = getDynamicDifficulty('go', 0);
      expect(result.thinkTime).toBeGreaterThanOrEqual(5000);
      expect(result.thinkTime).toBeLessThanOrEqual(15000);
    });

    it('should adjust thinkTime based on moveCount', () => {
      const earlyGame = getDynamicDifficulty('tictactoe', 5);
      const lateGame = getDynamicDifficulty('tictactoe', 20);
      expect(lateGame.thinkTime).toBeGreaterThanOrEqual(earlyGame.thinkTime);
    });

    it('should return valid config for all game types', () => {
      const gameTypes = ['tictactoe', 'gomoku', 'chinese_chess', 'go'];
      gameTypes.forEach(type => {
        const config = getDynamicDifficulty(type as any, 0);
        expect(config).toHaveProperty('thinkTime');
        expect(typeof config.thinkTime).toBe('number');
      });
    });
  });

  describe('getThinkingPhases', () => {
    it('should return 4 thinking phases', () => {
      const phases = getThinkingPhases(3000);
      expect(phases).toHaveLength(4);
    });

    it('should have correct phase names', () => {
      const phases = getThinkingPhases(3000);
      const phaseNames = phases.map(p => p.phase);
      expect(phaseNames).toContain('analyzing');
      expect(phaseNames).toContain('evaluating');
      expect(phaseNames).toContain('deciding');
      expect(phaseNames).toContain('ready');
    });

    it('should have increasing progress values', () => {
      const phases = getThinkingPhases(3000);
      for (let i = 1; i < phases.length; i++) {
        expect(phases[i].progress).toBeGreaterThan(phases[i - 1].progress);
      }
    });

    it('last phase should have 100% progress', () => {
      const phases = getThinkingPhases(3000);
      expect(phases[phases.length - 1].progress).toBe(100);
    });

    it('phases should have positive delays', () => {
      const phases = getThinkingPhases(5000);
      phases.forEach(phase => {
        expect(phase.delay).toBeGreaterThan(0);
      });
    });
  });

  describe('recordGameResult', () => {
    it('should increase currentLevel on win', () => {
      const initialState = getDifficultyState();
      recordGameResult(true);
      const afterWin = getDifficultyState();
      expect(afterWin.currentLevel).toBeGreaterThan(initialState.currentLevel);
      expect(afterWin.consecutiveWins).toBe(1);
      expect(afterWin.consecutiveLosses).toBe(0);
    });

    it('should decrease currentLevel on loss', () => {
      recordGameResult(true);
      const beforeLoss = getDifficultyState();
      recordGameResult(false);
      const afterLoss = getDifficultyState();
      expect(afterLoss.currentLevel).toBeLessThan(beforeLoss.currentLevel);
      expect(afterLoss.consecutiveWins).toBe(0);
      expect(afterLoss.consecutiveLosses).toBe(1);
    });

    it('should cap currentLevel at maximum 1', () => {
      for (let i = 0; i < 20; i++) {
        recordGameResult(true);
      }
      const state = getDifficultyState();
      expect(state.currentLevel).toBeLessThanOrEqual(1);
    });

    it('should not let currentLevel go below 0', () => {
      for (let i = 0; i < 20; i++) {
        recordGameResult(false);
      }
      const state = getDifficultyState();
      expect(state.currentLevel).toBeGreaterThanOrEqual(0);
    });

    it('should reset consecutive counters on opposite result', () => {
      recordGameResult(true);
      recordGameResult(true);
      expect(getDifficultyState().consecutiveWins).toBe(2);

      recordGameResult(false);
      const state = getDifficultyState();
      expect(state.consecutiveWins).toBe(0);
      expect(state.consecutiveLosses).toBe(1);
    });

    it('should increment totalGames counter', () => {
      const initial = getDifficultyState().totalGames;
      recordGameResult(true);
      expect(getDifficultyState().totalGames).toBe(initial + 1);

      recordGameResult(false);
      expect(getDifficultyState().totalGames).toBe(initial + 2);
    });
  });

  describe('resetDifficulty', () => {
    it('should reset all state to initial values', () => {
      recordGameResult(true);
      recordGameResult(false);
      recordGameResult(true);

      resetDifficulty();

      const state = getDifficultyState();
      expect(state.currentLevel).toBe(0.5);
      expect(state.consecutiveWins).toBe(0);
      expect(state.consecutiveLosses).toBe(0);
      expect(state.totalGames).toBe(0);
    });
  });

  describe('getDifficultyState', () => {
    it('should return immutable state object', () => {
      const state1 = getDifficultyState();
      (state1 as any).currentLevel = 999;
      const state2 = getDifficultyState();
      expect(state2.currentLevel).not.toBe(999);
    });
  });
});
