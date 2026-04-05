-- Migration: Add 'recalled' to message type ENUM
-- Date: 2026-04-05
-- Issue: Message recall not persisting because 'recalled' was not a valid ENUM value

ALTER TABLE `message` MODIFY COLUMN `type` ENUM('text', 'image', 'file', 'system', 'recalled') DEFAULT 'text';

-- Verify the change
DESCRIBE message;