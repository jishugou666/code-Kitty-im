-- ============================================
-- 表现分系统 - game_match 表新增字段
-- 版本: 2026-05-25
-- 用途: 存储每局游戏的表现评分、等级、称号、高光时刻
-- 迁移ID: 001_add_performance
-- ============================================

ALTER TABLE game_match 
ADD COLUMN performance_score DECIMAL(5,2) DEFAULT NULL COMMENT '表现分(0-100)',
ADD COLUMN performance_grade VARCHAR(2) DEFAULT NULL COMMENT '表现等级(S/A/B/C/D)',
ADD COLUMN performance_title VARCHAR(50) DEFAULT NULL COMMENT '表现称号',
ADD COLUMN highlights JSON DEFAULT NULL COMMENT '高光时刻列表',
ADD COLUMN performance_details JSON DEFAULT NULL COMMENT '表现分详细拆解';
