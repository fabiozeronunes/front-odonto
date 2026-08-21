import { prisma } from "../lib/prisma.js";

/**
 * Apply pending migrations on startup.
 * This is a temporary solution until Prisma migration tracking is properly set up.
 */
export async function applyMigrations() {
  try {
    // Check if emailVerified column exists
    const hasEmailVerified = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'User' AND column_name = 'emailVerified'
      ) as exists
    ` as { exists: boolean }[];

    if (!hasEmailVerified[0]?.exists) {
      console.log("[MIGRATION] Adding emailVerified column to User...");
      await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false`;
      console.log("[MIGRATION] emailVerified column added.");
    }

    // Check if EmailVerificationToken table exists
    const hasEVT = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'EmailVerificationToken'
      ) as exists
    ` as { exists: boolean }[];

    if (!hasEVT[0]?.exists) {
      console.log("[MIGRATION] Creating EmailVerificationToken table...");
      await prisma.$executeRaw`
        CREATE TABLE "EmailVerificationToken" (
          "id" TEXT NOT NULL,
          "token" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "expiresAt" TIMESTAMP(3) NOT NULL,
          "usedAt" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
        )
      `;
      await prisma.$executeRaw`CREATE UNIQUE INDEX "EmailVerificationToken_token_key" ON "EmailVerificationToken"("token")`;
      await prisma.$executeRaw`CREATE INDEX "EmailVerificationToken_token_idx" ON "EmailVerificationToken"("token")`;
      await prisma.$executeRaw`CREATE INDEX "EmailVerificationToken_userId_idx" ON "EmailVerificationToken"("userId")`;
      await prisma.$executeRaw`
        ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      `;
      console.log("[MIGRATION] EmailVerificationToken table created.");
    }

    // Check if AuditLog table exists
    const hasAuditLog = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'AuditLog'
      ) as exists
    ` as { exists: boolean }[];

    if (!hasAuditLog[0]?.exists) {
      console.log("[MIGRATION] Creating AuditLog table...");
      await prisma.$executeRaw`
        CREATE TABLE "AuditLog" (
          "id" TEXT NOT NULL,
          "userId" TEXT,
          "action" TEXT NOT NULL,
          "resource" TEXT,
          "resourceId" TEXT,
          "details" JSONB,
          "ipAddress" TEXT,
          "userAgent" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
        )
      `;
      await prisma.$executeRaw`CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId")`;
      await prisma.$executeRaw`CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action")`;
      await prisma.$executeRaw`CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt")`;
      await prisma.$executeRaw`
        ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
      `;
      console.log("[MIGRATION] AuditLog table created.");
    }

    console.log("[MIGRATION] All migrations applied successfully.");
  } catch (err) {
    console.error("[MIGRATION] Error applying migrations:", err);
  }
}
