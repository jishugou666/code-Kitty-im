export const ConversationModel = {
  tableName: 'conversation',

  createTableSQL: `
    CREATE TABLE IF NOT EXISTS conversation (
      id INT PRIMARY KEY AUTO_INCREMENT,
      type ENUM('single', 'group') DEFAULT 'single',
      name VARCHAR(100) COMMENT '群聊名称',
      avatar VARCHAR(500),
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_type (type),
      INDEX idx_created_by (created_by)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `
};

export const ConversationMemberModel = {
  tableName: 'conversation_member',

  createTableSQL: `
    CREATE TABLE IF NOT EXISTS conversation_member (
      id INT PRIMARY KEY AUTO_INCREMENT,
      conversation_id INT NOT NULL,
      user_id INT NOT NULL,
      role ENUM('owner', 'admin', 'member') DEFAULT 'member',
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_conversation_user (conversation_id, user_id),
      INDEX idx_user_id (user_id),
      FOREIGN KEY (conversation_id) REFERENCES conversation(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `
};
