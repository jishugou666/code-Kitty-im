-- IM Chat App Database Initialization Script
-- 执行此脚本前请确保已创建数据库: CREATE DATABASE IF NOT EXISTS im_chat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE im_chat;

-- ============================================
-- 用户表
-- ============================================
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 会话表
-- ============================================
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 会话成员表
-- ============================================
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 消息表
-- ============================================
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 消息已读状态表（用于追踪消息阅读状态）
-- ============================================
CREATE TABLE IF NOT EXISTS message_read (
  id INT PRIMARY KEY AUTO_INCREMENT,
  conversation_id INT NOT NULL,
  user_id INT NOT NULL,
  seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_conversation_user (conversation_id, user_id),
  INDEX idx_conversation_id (conversation_id),
  INDEX idx_user_id (user_id),
  FOREIGN KEY (conversation_id) REFERENCES conversation(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 联系人表
-- ============================================
CREATE TABLE IF NOT EXISTS contact (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  contact_user_id INT NOT NULL,
  status ENUM('pending', 'accepted', 'blocked') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_contact (user_id, contact_user_id),
  INDEX idx_user_id (user_id),
  INDEX idx_contact_user_id (contact_user_id),
  INDEX idx_status (status),
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_user_id) REFERENCES user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 插入测试用户（密码为 123456 的 bcrypt 哈希）
-- ============================================
-- 哈希值对应: 123456
INSERT IGNORE INTO user (username, password, nickname, avatar, email, status) VALUES
('user1', '$2b$10$rQZ8K7WV5YzG5tX5tX5tXeO6rO7rO7rO7rO7rO7rO7rO7rO7rO7r', 'User One', 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1', 'user1@example.com', 1),
('user2', '$2b$10$rQZ8K7WV5YzG5tX5tX5tXeO6rO7rO7rO7rO7rO7rO7rO7rO7rO7r', 'User Two', 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2', 'user2@example.com', 1),
('user3', '$2b$10$rQZ8K7WV5YzG5tX5tX5tXeO6rO7rO7rO7rO7rO7rO7rO7rO7rO7r', 'User Three', 'https://api.dicebear.com/7.x/avataaars/svg?seed=user3', 'user3@example.com', 1);

SELECT 'Database initialization completed successfully!' AS message;
