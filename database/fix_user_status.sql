-- 修复用户状态数据同步问题

-- 1. 首先检查字段是否存在，如果不存在则添加
-- ALTER TABLE `user` ADD COLUMN IF NOT EXISTS `ban_status` ENUM('active', 'banned') DEFAULT 'active' AFTER `status`;

-- 2. 同步 status 和 ban_status
-- 如果 status = 0 (封禁) 但 ban_status 不是 'banned'，则修正
UPDATE `user` SET `ban_status` = 'banned' WHERE `status` = 0 AND `ban_status` != 'banned';

-- 如果 status = 1 (正常) 但 ban_status 是 'banned'，则修正
UPDATE `user` SET `ban_status` = 'active', `banned_at` = NULL, `ban_expires_at` = NULL, `ban_reason` = NULL WHERE `status` = 1 AND `ban_status` = 'banned';

-- 如果 ban_status = 'banned' 但 status = 1 (正常)，则修正
UPDATE `user` SET `status` = 0 WHERE `ban_status` = 'banned' AND `status` = 1;

-- 如果 ban_status = 'active' 但 status = 0 (封禁)，则修正
UPDATE `user` SET `status` = 1 WHERE `ban_status` = 'active' AND `status` = 0;

-- 3. 检查是否有到期的封禁需要自动解封
-- UPDATE `user` SET `status` = 1, `ban_status` = 'active' WHERE `ban_status` = 'banned' AND `ban_expires_at` IS NOT NULL AND `ban_expires_at` < NOW();

-- 4. 验证修复结果
SELECT id, username, status, ban_status, banned_at, ban_expires_at, ban_reason FROM `user` ORDER BY id LIMIT 20;