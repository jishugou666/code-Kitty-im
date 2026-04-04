-- =====================================================
-- IM Chat App 数据库迁移脚本 v2
-- 新增功能：朋友圈、Admin后台、设置、临时会话
-- =====================================================

-- 1. 朋友圈动态表
CREATE TABLE IF NOT EXISTS `moments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT '发布者用户ID',
  `content` TEXT COMMENT '动态内容',
  `images` JSON COMMENT '图片URL数组',
  `likes_count` INT DEFAULT 0 COMMENT '点赞数',
  `comments_count` INT DEFAULT 0 COMMENT '评论数',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL COMMENT '软删除时间',
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='朋友圈动态表';

-- 2. 朋友圈点赞表
CREATE TABLE IF NOT EXISTS `moments_like` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `moment_id` INT NOT NULL COMMENT '动态ID',
  `user_id` INT NOT NULL COMMENT '点赞用户ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_moment_user` (`moment_id`, `user_id`),
  INDEX `idx_moment_id` (`moment_id`),
  INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='朋友圈点赞表';

-- 3. 朋友圈评论表
CREATE TABLE IF NOT EXISTS `moments_comment` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `moment_id` INT NOT NULL COMMENT '动态ID',
  `user_id` INT NOT NULL COMMENT '评论用户ID',
  `parent_id` INT NULL COMMENT '父评论ID（用于回复）',
  `content` TEXT NOT NULL COMMENT '评论内容',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL COMMENT '软删除时间',
  INDEX `idx_moment_id` (`moment_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='朋友圈评论表';

-- 4. 用户设置表
CREATE TABLE IF NOT EXISTS `user_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE COMMENT '用户ID',
  `language` VARCHAR(10) DEFAULT 'zh-CN' COMMENT '语言设置 zh-CN/en-US',
  `theme` VARCHAR(20) DEFAULT 'light' COMMENT '主题设置 light/dark',
  `privacy_mode` TINYINT DEFAULT 0 COMMENT '隐私模式 0关闭 1开启',
  `notification_sound` TINYINT DEFAULT 1 COMMENT '通知声音 0关闭 1开启',
  `notification_push` TINYINT DEFAULT 1 COMMENT '推送通知 0关闭 1开启',
  `show_online_status` TINYINT DEFAULT 1 COMMENT '显示在线状态 0关闭 1开启',
  `allow_stranger_msg` TINYINT DEFAULT 1 COMMENT '允许陌生人消息 0关闭 1开启',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户设置表';

-- 5. 管理员操作日志表
CREATE TABLE IF NOT EXISTS `admin_log` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `admin_id` INT NOT NULL COMMENT '管理员ID',
  `action` VARCHAR(50) NOT NULL COMMENT '操作类型',
  `target_type` VARCHAR(50) COMMENT '目标类型 user/message/moment',
  `target_id` INT COMMENT '目标ID',
  `details` JSON COMMENT '操作详情',
  `ip_address` VARCHAR(45) COMMENT 'IP地址',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_admin_id` (`admin_id`),
  INDEX `idx_action` (`action`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员操作日志表';

-- 6. 临时会话记录表（用于标识临时会话）
CREATE TABLE IF NOT EXISTS `temp_conversation` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `conversation_id` INT NOT NULL COMMENT '会话ID',
  `user_id` INT NOT NULL COMMENT '发起方用户ID',
  `target_user_id` INT NOT NULL COMMENT '目标用户ID',
  `is_blocked` TINYINT DEFAULT 0 COMMENT '是否被封禁',
  `warning_count` INT DEFAULT 0 COMMENT '警告次数',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP NULL COMMENT '过期时间',
  UNIQUE KEY `uk_conversation_user` (`conversation_id`, `user_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_target_user_id` (`target_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='临时会话记录表';

-- 7. 好友关系增强表（增加状态字段）
ALTER TABLE `contact` ADD COLUMN IF NOT EXISTS `is_friend` TINYINT DEFAULT 0 COMMENT '是否为好友 0否 1是';
ALTER TABLE `contact` ADD COLUMN IF NOT EXISTS `friend_time` TIMESTAMP NULL COMMENT '成为好友时间';

-- 8. 插入默认管理员（邮箱: 3121601311@qq.com）
INSERT IGNORE INTO `user` (`username`, `nickname`, `email`, `password`, `role`, `status`, `created_at`)
VALUES ('admin', 'Administrator', '3121601311@qq.com', '$2b$10$YOUR_HASHED_PASSWORD', 'admin', 1, NOW());

-- 9. 创建默认用户设置（针对新注册用户需要触发器或应用层处理）
-- 这个通过应用层处理

-- 10. 更新现有contact记录，将已经是双向联系人的设为好友
-- 这个需要通过应用层处理，因为需要判断双向关系

-- =====================================================
-- 完成！
-- =====================================================