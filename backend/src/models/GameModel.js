export const GameModel = {
  game_match: `
    CREATE TABLE IF NOT EXISTS game_match (
      id INT PRIMARY KEY AUTO_INCREMENT,
      game_type ENUM('gomoku','tictactoe','chess') NOT NULL,
      mode ENUM('ai','pvp') NOT NULL DEFAULT 'ai',
      player1_id INT NOT NULL,
      player2_id INT DEFAULT NULL,
      winner_id INT DEFAULT NULL,
      status ENUM('playing','finished','abandoned') NOT NULL DEFAULT 'playing',
      ai_difficulty ENUM('easy','medium','hard') DEFAULT 'medium',
      moves JSON DEFAULT NULL,
      duration_seconds INT DEFAULT NULL,
      score_change INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      finished_at TIMESTAMP DEFAULT NULL,
      INDEX idx_player1 (player1_id),
      INDEX idx_player2 (player2_id),
      INDEX idx_status (status),
      INDEX idx_game_type (game_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,

  user_game_profile: `
    CREATE TABLE IF NOT EXISTS user_game_profile (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT UNIQUE NOT NULL,
      total_games INT DEFAULT 0,
      wins INT DEFAULT 0,
      losses INT DEFAULT 0,
      draws INT DEFAULT 0,
      rating INT DEFAULT 1000,
      peak_rating INT DEFAULT 1000,
      rank_tier VARCHAR(20) DEFAULT 'iron',
      gomoku_wins INT DEFAULT 0,
      gomoku_losses INT DEFAULT 0,
      tictactoe_wins INT DEFAULT 0,
      tictactoe_losses INT DEFAULT 0,
      chess_wins INT DEFAULT 0,
      chess_losses INT DEFAULT 0,
      current_win_streak INT DEFAULT 0,
      best_win_streak INT DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_user_id (user_id),
      INDEX idx_rating (rating)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,

  get createTableSQL() {
    return [this.game_match, this.user_game_profile];
  }
};
