-- =============================================
-- AI 反馈系统数据库表结构
-- Code Kitty IM - AI Feedback System
-- =============================================

-- AI 反馈记录表
-- 存储AI检测到的各类异常行为和内容
CREATE TABLE IF NOT EXISTS `ai_feedback` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `type` ENUM('spam', 'malicious', 'suspicious', 'flood', 'repeat', 'sensitive') NOT NULL DEFAULT 'suspicious' COMMENT '反馈类型: spam垃圾信息, malicious恶意攻击, suspicious可疑行为, flood刷屏, repeat重复消息, sensitive敏感内容',
  `severity` ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium' COMMENT '严重程度',
  `user_id` INT COMMENT '关联用户ID',
  `target_type` ENUM('message', 'user', 'conversation', 'moments') COMMENT '目标类型',
  `target_id` INT COMMENT '目标ID',
  `content` TEXT COMMENT '问题内容摘要',
  `content_full` TEXT COMMENT '完整内容（用于溯源）',
  `metadata` JSON COMMENT '额外元数据: IP地址、设备信息、发送时间等',
  `ai_confidence` DECIMAL(5,2) DEFAULT 0.00 COMMENT 'AI置信度 0-100',
  `ai_analysis` TEXT COMMENT 'AI分析结果',
  `status` ENUM('pending', 'approved', 'rejected', 'expired') NOT NULL DEFAULT 'pending' COMMENT '状态: pending待处理, approved已通过(删除), rejected已驳回, expired已过期',
  `handled_by` INT COMMENT '处理人ID(管理员)',
  `handled_at` TIMESTAMP NULL COMMENT '处理时间',
  `handle_result` TEXT COMMENT '处理结果备注',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_type_status` (`type`, `status`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_target` (`target_type`, `target_id`),
  INDEX `idx_severity` (`severity`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI反馈记录表';

-- AI 服务实时状态表
-- 记录各AI服务的当前运行状态和任务
CREATE TABLE IF NOT EXISTS `ai_service_status` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `service_name` VARCHAR(50) NOT NULL COMMENT '服务名称: antiSpam, rateLimiter, intelligentCache等',
  `instance_id` VARCHAR(100) DEFAULT 'default' COMMENT '实例ID（支持多实例）',
  `status` ENUM('running', 'idle', 'error', 'maintenance') NOT NULL DEFAULT 'idle' COMMENT '服务状态',
  `current_task` VARCHAR(255) COMMENT '当前任务描述',
  `task_progress` INT DEFAULT 0 COMMENT '任务进度 0-100',
  `task_detail` JSON COMMENT '任务详情: 监控的会话数、处理的请求数等',
  `metrics` JSON COMMENT '运行时指标',
  `last_heartbeat` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后心跳时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_service_instance` (`service_name`, `instance_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_last_heartbeat` (`last_heartbeat`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI服务实时状态表';

-- AI 活动日志表
-- 记录AI服务的操作日志
CREATE TABLE IF NOT EXISTS `ai_activity_log` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `service_name` VARCHAR(50) NOT NULL COMMENT '服务名称',
  `action` VARCHAR(100) NOT NULL COMMENT '操作类型: block, allow, warn, detect, alert',
  `target_type` VARCHAR(50) COMMENT '目标类型: user, ip, message, conversation',
  `target_id` INT COMMENT '目标ID',
  `result` ENUM('success', 'failed', 'skipped') DEFAULT 'success' COMMENT '操作结果',
  `details` JSON COMMENT '操作详情',
  `ip_address` VARCHAR(45) COMMENT '关联IP地址',
  `user_id` INT COMMENT '关联用户ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_service_action` (`service_name`, `action`),
  INDEX `idx_target` (`target_type`, `target_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI活动日志表';

-- AI 监控黑名单表
-- 存储被AI识别的恶意用户和IP
CREATE TABLE IF NOT EXISTS `ai_blacklist` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `type` ENUM('user', 'ip', 'device', 'content') NOT NULL COMMENT '黑名单类型',
  `value` VARCHAR(500) NOT NULL COMMENT '黑名单值: 用户ID, IP地址, 设备指纹, 敏感内容哈希',
  `reason` TEXT COMMENT '加入原因',
  `source` ENUM('ai_detected', 'admin_added', 'user_reported', 'system') NOT NULL DEFAULT 'ai_detected' COMMENT '来源',
  `severity` ENUM('warning', 'mute', 'block', 'ban') DEFAULT 'warning' COMMENT '严重程度: warning警告, mute禁言, block封禁会话, ban封号',
  `expires_at` TIMESTAMP NULL COMMENT '过期时间(NULL表示永久)',
  `auto_expire` TINYINT DEFAULT 1 COMMENT '是否自动过期',
  `hit_count` INT DEFAULT 0 COMMENT '触发次数',
  `last_hit_at` TIMESTAMP NULL COMMENT '最后触发时间',
  `created_by` INT COMMENT '创建人(管理员)',
  `status` ENUM('active', 'inactive', 'expired') DEFAULT 'active' COMMENT '状态',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_type_value` (`type`, `value`),
  INDEX `idx_status_expires` (`status`, `expires_at`),
  INDEX `idx_source` (`source`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI监控黑名单表';

-- AI 敏感内容指纹表
-- 存储敏感内容的哈希值用于快速匹配
CREATE TABLE IF NOT EXISTS `ai_content_fingerprint` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `fingerprint` VARCHAR(64) NOT NULL COMMENT '内容SHA256哈希',
  `content_hash` VARCHAR(64) NOT NULL COMMENT '原始内容哈希(用于比对相似度)',
  `category` ENUM('spam', 'ad', 'fraud', 'politics', 'porn', 'custom') NOT NULL COMMENT '内容类别',
  `similarity_threshold` INT DEFAULT 85 COMMENT '相似度阈值(百分比)',
  `source` VARCHAR(100) COMMENT '来源',
  `confidence` INT DEFAULT 100 COMMENT '置信度',
  `status` ENUM('active', 'inactive') DEFAULT 'active' COMMENT '状态',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_fingerprint` (`fingerprint`),
  INDEX `idx_category_status` (`category`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI敏感内容指纹表';

-- =============================================
-- 测试数据
-- =============================================

-- 插入AI服务状态初始记录
INSERT INTO `ai_service_status` (`service_name`, `instance_id`, `status`, `current_task`, `task_progress`, `task_detail`, `metrics`) VALUES
('antiSpam', 'default', 'running', '监控中: 0个活跃会话', 100, '{"monitored_conversations": 0, "messages_processed": 0, "threats_blocked": 0}', '{"cpu": 0, "memory": 0}'),
('rateLimiter', 'default', 'running', '限流保护中: 0个活跃IP', 100, '{"active_ips": 0, "requests_allowed": 0, "requests_blocked": 0}', '{"cpu": 0, "memory": 0}'),
('intelligentCache', 'default', 'running', '缓存服务运行中', 100, '{"cache_size": 0, "hit_rate": 0}', '{"cpu": 0, "memory": 0}'),
('queryOptimizer', 'default', 'idle', '等待查询任务', 0, '{"queries_optimized": 0}', '{"cpu": 0, "memory": 0}'),
('dataPrefetcher', 'default', 'running', '预取服务运行中', 100, '{"prefetched_count": 0}', '{"cpu": 0, "memory": 0}'),
('loadBalancer', 'default', 'running', '负载均衡运行中', 100, '{"active_requests": 0}', '{"cpu": 0, "memory": 0}')
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`), `current_task` = VALUES(`current_task`), `last_heartbeat` = CURRENT_TIMESTAMP;
