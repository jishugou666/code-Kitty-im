-- Studio 官网后台配置表

CREATE TABLE IF NOT EXISTS `studio_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `section` VARCHAR(50) NOT NULL COMMENT '配置区域: hero/about/works/members/features/cta/footer',
  `key` VARCHAR(100) NOT NULL COMMENT '配置键名',
  `value` TEXT NOT NULL COMMENT '配置值(JSON格式)',
  `type` VARCHAR(20) DEFAULT 'string' COMMENT '数据类型: string/number/boolean/json',
  `description` VARCHAR(255) DEFAULT '' COMMENT '配置说明',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_section_key` (`section`, `key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 工作室管理员账号表
CREATE TABLE IF NOT EXISTS `studio_admin` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL COMMENT 'bcrypt加密密码',
  `role` VARCHAR(20) DEFAULT 'admin' COMMENT '角色: admin/super_admin',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
