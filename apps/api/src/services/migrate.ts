import { prisma } from "../lib/prisma.js";

/**
 * Apply pending migrations on startup.
 * This is a temporary solution until Prisma migration tracking is properly set up.
 */
export async function applyMigrations() {
  try {
    // Check if emailVerified column exists in users table
    const hasEmailVerified = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'emailVerified'
      ) as exists
    ` as { exists: boolean }[];

    if (!hasEmailVerified[0]?.exists) {
      console.log("[MIGRATION] Adding emailVerified column to users...");
      await prisma.$executeRaw`ALTER TABLE "users" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false`;
      console.log("[MIGRATION] emailVerified column added.");
    }

    // Check if emailVerificationTokens table exists
    const hasTable = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'emailVerificationTokens'
      ) as exists
    ` as { exists: boolean }[];

    if (!hasTable[0]?.exists) {
      console.log("[MIGRATION] Creating emailVerificationTokens table...");
      await prisma.$executeRaw`
        CREATE TABLE "emailVerificationTokens" (
          "id" TEXT NOT NULL,
          "token" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "expiresAt" TIMESTAMP(3) NOT NULL,
          "usedAt" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "emailVerificationTokens_pkey" PRIMARY KEY ("id")
        )
      `;
      await prisma.$executeRaw`CREATE UNIQUE INDEX "emailVerificationTokens_token_key" ON "emailVerificationTokens"("token")`;
      await prisma.$executeRaw`CREATE INDEX "emailVerificationTokens_token_idx" ON "emailVerificationTokens"("token")`;
      await prisma.$executeRaw`CREATE INDEX "emailVerificationTokens_userId_idx" ON "emailVerificationTokens"("userId")`;
      await prisma.$executeRaw`
        ALTER TABLE "emailVerificationTokens" ADD CONSTRAINT "emailVerificationTokens_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
      `;
      console.log("[MIGRATION] emailVerificationTokens table created.");
    }

    // Check if auditLogs table exists
    const hasAuditLogs = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'auditLogs'
      ) as exists
    ` as { exists: boolean }[];

    if (!hasAuditLogs[0]?.exists) {
      console.log("[MIGRATION] Creating auditLogs table...");
      await prisma.$executeRaw`
        CREATE TABLE "auditLogs" (
          "id" TEXT NOT NULL,
          "userId" TEXT,
          "action" TEXT NOT NULL,
          "resource" TEXT,
          "resourceId" TEXT,
          "details" JSONB,
          "ipAddress" TEXT,
          "userAgent" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "auditLogs_pkey" PRIMARY KEY ("id")
        )
      `;
      await prisma.$executeRaw`CREATE INDEX "auditLogs_userId_idx" ON "auditLogs"("userId")`;
      await prisma.$executeRaw`CREATE INDEX "auditLogs_action_idx" ON "auditLogs"("action")`;
      await prisma.$executeRaw`CREATE INDEX "auditLogs_createdAt_idx" ON "auditLogs"("createdAt")`;
      console.log("[MIGRATION] auditLogs table created.");
    }

    console.log("[MIGRATION] All migrations applied successfully.");
  } catch (err) {
    console.error("[MIGRATION] Error applying migrations:", err);
    // Don't crash the server, just log the error
  }
}
