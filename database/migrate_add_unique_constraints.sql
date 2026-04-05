-- Migration: Add unique constraints to user table
-- Run this script to fix email and nickname uniqueness constraints

-- Add unique constraint to email if not exists
ALTER TABLE user ADD CONSTRAINT user_email_unique UNIQUE (email);

-- Add unique constraint to nickname if not exists
ALTER TABLE user ADD CONSTRAINT user_nickname_unique UNIQUE (nickname);

-- Add role column if not exists
ALTER TABLE user ADD COLUMN IF NOT EXISTS role ENUM('user', 'admin', 'tech_god') DEFAULT 'user' AFTER phone;

-- Verify the constraints
DESCRIBE user;
