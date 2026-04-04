export const MessageModel = {
  tableName: 'message',

  createTableSQL: `
    CREATE TABLE IF NOT EXISTS message (
      id INT PRIMARY KEY AUTO_INCREMENT,
      conversation_id INT NOT NULL,
      sender_id INT NOT NULL,
      type ENUM('text', 'image', 'file', 'system') DEFAULT 'text',
      content TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_conversation_id (conversation_id),
      INDEX idx_sender_id (sender_id),
      INDEX idx_created_at (created_at),
      FOREIGN KEY (conversation_id) REFERENCES conversation(id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES user(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `
};
