-- Add avatarUrl field to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
