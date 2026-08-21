import { prisma } from "../lib/prisma.js";

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
    }

    // Check if EmailVerificationToken table exists
    const hasEVT = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables WHERE table_name = 'EmailVerificationToken'
      ) as exists
    ` as { exists: boolean }[];

    if (!hasEVT[0]?.exists) {
      console.log("[MIGRATION] Creating EmailVerificationToken...");
      await prisma.$executeRaw`
        CREATE TABLE "EmailVerificationToken" (
          "id" TEXT NOT NULL, "token" TEXT NOT NULL, "userId" TEXT NOT NULL,
          "expiresAt" TIMESTAMP(3) NOT NULL, "usedAt" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id"))
      `;
      await prisma.$executeRaw`CREATE UNIQUE INDEX "EmailVerificationToken_token_key" ON "EmailVerificationToken"("token")`;
      await prisma.$executeRaw`CREATE INDEX "EmailVerificationToken_token_idx" ON "EmailVerificationToken"("token")`;
      await prisma.$executeRaw`CREATE INDEX "EmailVerificationToken_userId_idx" ON "EmailVerificationToken"("userId")`;
      await prisma.$executeRaw`ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`;
    }

    // Check if AuditLog table exists
    const hasAuditLog = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables WHERE table_name = 'AuditLog'
      ) as exists
    ` as { exists: boolean }[];

    if (!hasAuditLog[0]?.exists) {
      console.log("[MIGRATION] Creating AuditLog...");
      await prisma.$executeRaw`
        CREATE TABLE "AuditLog" (
          "id" TEXT NOT NULL, "userId" TEXT, "action" TEXT NOT NULL,
          "resource" TEXT, "resourceId" TEXT, "details" JSONB,
          "ipAddress" TEXT, "userAgent" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id"))
      `;
      await prisma.$executeRaw`CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId")`;
      await prisma.$executeRaw`CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action")`;
      await prisma.$executeRaw`CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt")`;
      await prisma.$executeRaw`ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE`;
    }

    // Check if RefreshToken table exists
    const hasRefreshToken = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables WHERE table_name = 'RefreshToken'
      ) as exists
    ` as { exists: boolean }[];

    if (!hasRefreshToken[0]?.exists) {
      console.log("[MIGRATION] Creating RefreshToken...");
      await prisma.$executeRaw`
        CREATE TABLE "RefreshToken" (
          "id" TEXT NOT NULL, "token" TEXT NOT NULL, "userId" TEXT NOT NULL,
          "expiresAt" TIMESTAMP(3) NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id"))
      `;
      await prisma.$executeRaw`CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token")`;
      await prisma.$executeRaw`CREATE INDEX "RefreshToken_token_idx" ON "RefreshToken"("token")`;
      await prisma.$executeRaw`CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId")`;
      await prisma.$executeRaw`ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`;
    }

    // Check if TwoFactorSecret table exists
    const has2FA = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables WHERE table_name = 'TwoFactorSecret'
      ) as exists
    ` as { exists: boolean }[];

    if (!has2FA[0]?.exists) {
      console.log("[MIGRATION] Creating TwoFactorSecret...");
      await prisma.$executeRaw`
        CREATE TABLE "TwoFactorSecret" (
          "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "secret" TEXT NOT NULL,
          "enabled" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "TwoFactorSecret_pkey" PRIMARY KEY ("id"))
      `;
      await prisma.$executeRaw`CREATE UNIQUE INDEX "TwoFactorSecret_userId_key" ON "TwoFactorSecret"("userId")`;
      await prisma.$executeRaw`ALTER TABLE "TwoFactorSecret" ADD CONSTRAINT "TwoFactorSecret_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`;
    }

    // Check if LoginAttempt table exists
    const hasLoginAttempt = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables WHERE table_name = 'LoginAttempt'
      ) as exists
    ` as { exists: boolean }[];

    if (!hasLoginAttempt[0]?.exists) {
      console.log("[MIGRATION] Creating LoginAttempt...");
      await prisma.$executeRaw`
        CREATE TABLE "LoginAttempt" (
          "id" TEXT NOT NULL, "email" TEXT NOT NULL, "ip" TEXT NOT NULL,
          "success" BOOLEAN NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id"))
      `;
      await prisma.$executeRaw`CREATE INDEX "LoginAttempt_email_idx" ON "LoginAttempt"("email")`;
      await prisma.$executeRaw`CREATE INDEX "LoginAttempt_ip_idx" ON "LoginAttempt"("ip")`;
      await prisma.$executeRaw`CREATE INDEX "LoginAttempt_createdAt_idx" ON "LoginAttempt"("createdAt")`;
    }

    console.log("[MIGRATION] All migrations applied successfully.");
  } catch (err) {
    console.error("[MIGRATION] Error applying migrations:", err);
  }
}
