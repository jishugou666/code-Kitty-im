export const UserModel = {
  tableName: 'user',

  fields: {
    id: 'INT PRIMARY KEY AUTO_INCREMENT',
    username: 'VARCHAR(50) UNIQUE NOT NULL',
    password: 'VARCHAR(255) NOT NULL',
    nickname: 'VARCHAR(100)',
    avatar: 'VARCHAR(500)',
    email: 'VARCHAR(100)',
    phone: 'VARCHAR(20)',
    status: "TINYINT DEFAULT 1 COMMENT '1在线 0离线'",
    created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
  },

  createTableSQL: `
    CREATE TABLE IF NOT EXISTS user (
      id INT PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      nickname VARCHAR(100),
      avatar VARCHAR(500),
      email VARCHAR(100),
      phone VARCHAR(20),
      status TINYINT DEFAULT 1 COMMENT '1在线 0离线',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_username (username),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `
};
