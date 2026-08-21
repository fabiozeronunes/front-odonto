-- Migration: Add email verification features
-- Run this on the production database

-- 1. Add emailVerified column to users table
ALTER TABLE "users" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;

-- 2. Create emailVerificationTokens table
CREATE TABLE "emailVerificationTokens" (
  "id" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "emailVerificationTokens_pkey" PRIMARY KEY ("id")
);

-- Create unique index on token
CREATE UNIQUE INDEX "emailVerificationTokens_token_key" ON "emailVerificationTokens"("token");

-- Create index on token for fast lookups
CREATE INDEX "emailVerificationTokens_token_idx" ON "emailVerificationTokens"("token");

-- Create index on userId for fast lookups
CREATE INDEX "emailVerificationTokens_userId_idx" ON "emailVerificationTokens"("userId");

-- Add foreign key constraint
ALTER TABLE "emailVerificationTokens" ADD CONSTRAINT "emailVerificationTokens_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
