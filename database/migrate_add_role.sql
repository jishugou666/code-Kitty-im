-- ============================================
-- 用户权限管理迁移脚本
-- 执行时间: 2026-04-04
-- ============================================

-- 1. 添加 role 字段（默认为 'user' 普通用户）
ALTER TABLE user ADD COLUMN role ENUM('user', 'admin', 'tech_god') DEFAULT 'user' COMMENT 'user普通用户, admin管理员, tech_god技术狗' AFTER phone;

-- 2. 将 email 字段改为 UNIQUE 且 NOT NULL
ALTER TABLE user MODIFY COLUMN email VARCHAR(100) UNIQUE NOT NULL;

-- 3. 将 username 字段改为非必填（可为空）
ALTER TABLE user MODIFY COLUMN username VARCHAR(50) UNIQUE;

-- 4. 将 nickname 字段改为 NOT NULL
ALTER TABLE user MODIFY COLUMN nickname VARCHAR(100) NOT NULL;

-- 5. 更新现有测试用户为普通用户权限
UPDATE user SET role = 'user' WHERE role IS NULL OR role = 'user';

-- 6. 可选：将某个用户设置为"技术狗"权限（示例：将 email 为 admin@example.com 的用户设为 tech_god）
-- UPDATE user SET role = 'tech_god' WHERE email = 'admin@example.com';

-- ============================================
-- 验证查询
-- ============================================
-- SELECT id, username, nickname, email, role FROM user;
