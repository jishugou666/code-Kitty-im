-- 添加封禁状态字段
ALTER TABLE `user` ADD COLUMN IF NOT EXISTS `ban_status` ENUM('active', 'banned') DEFAULT 'active' COMMENT '账户状态 active正常 banned封禁' AFTER `status`;

-- 添加封禁时间字段
ALTER TABLE `user` ADD COLUMN IF NOT EXISTS `banned_at` TIMESTAMP NULL COMMENT '封禁时间' AFTER `ban_status`;

-- 添加封禁到期时间字段
ALTER TABLE `user` ADD COLUMN IF NOT EXISTS `ban_expires_at` TIMESTAMP NULL COMMENT '封禁到期时间（永久封禁为NULL）' AFTER `banned_at`;

-- 添加封禁原因字段
ALTER TABLE `user` ADD COLUMN IF NOT EXISTS `ban_reason` VARCHAR(500) NULL COMMENT '封禁原因' AFTER `ban_expires_at`;

-- 添加封禁者ID字段（记录谁封禁的）
ALTER TABLE `user` ADD COLUMN IF NOT EXISTS `banned_by` INT NULL COMMENT '封禁者ID' AFTER `ban_reason`;

-- 添加IP地址记录表
CREATE TABLE IF NOT EXISTS `user_ip_log` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL COMMENT '用户ID',
  `ip_address` VARCHAR(45) NOT NULL COMMENT 'IP地址（支持IPv6）',
  `ip_country` VARCHAR(50) NULL COMMENT 'IP国家/地区',
  `ip_city` VARCHAR(100) NULL COMMENT 'IP城市',
  `ip_isp` VARCHAR(100) NULL COMMENT 'ISP服务商',
  `user_agent` VARCHAR(500) NULL COMMENT '浏览器UA',
  `login_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
  `INDEX idx_user_id` (`user_id`),
  INDEX idx_ip_address (`ip_address`),
  INDEX idx_login_time (`login_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户IP记录表';

-- 添加IP封禁表
CREATE TABLE IF NOT EXISTS `ip_ban` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `ip_address` VARCHAR(45) NOT NULL COMMENT 'IP地址',
  `ip_range` VARCHAR(50) NULL COMMENT 'IP段（如 192.168.1.*）',
  `ban_type` ENUM('exact', 'range', 'subnet') DEFAULT 'exact' COMMENT '封禁类型',
  `ban_reason` VARCHAR(500) NULL COMMENT '封禁原因',
  `ban_by` INT NULL COMMENT '封禁者ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP NULL COMMENT '到期时间（永久为NULL）',
  `is_active` TINYINT DEFAULT 1 COMMENT '是否生效',
  INDEX idx_ip_address (`ip_address`),
  INDEX idx_expires_at (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='IP封禁表';

-- 更新现有管理员的ban_status
UPDATE `user` SET ban_status = 'active' WHERE ban_status IS NULL;

-- 标记为完成
SELECT 'Migration completed: Added ban_status, ban_expires_at, ban_reason, banned_by, user_ip_log and ip_ban tables' as message;