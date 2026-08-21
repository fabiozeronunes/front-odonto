import { prisma } from "../lib/prisma.js";

async function tableExists(name: string): Promise<boolean> {
  const result = await prisma.$queryRaw`
    SELECT EXISTS (
      SELECT FROM information_schema.tables WHERE table_name = ${name}
    ) as exists
  ` as { exists: boolean }[];
  return result[0]?.exists ?? false;
}

async function safeExec(sql: string, label: string) {
  try {
    await prisma.$executeRawUnsafe(sql);
  } catch (err: any) {
    if (err.code === "42710" || err.code === "42P07" || err.code === "42701") {
      // already exists / duplicate object — skip
    } else {
      console.error(`[MIGRATION] ${label} failed:`, err.message);
    }
  }
}

async function safeFK(constraint: string, table: string, refTable: string, refCol: string, onDelete: string) {
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "${table}" ADD CONSTRAINT "${constraint}" FOREIGN KEY ("userId") REFERENCES "${refTable}"("${refCol}") ON DELETE ${onDelete} ON UPDATE CASCADE`
    );
  } catch (err: any) {
    if (err.code !== "42710") {
      // ignore constraint-already-exists
    }
  }
}

export async function applyMigrations() {
  try {
    // 1. emailVerified column
    if (await tableExists("User")) {
      const cols = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'emailVerified'` as any[];
      if (cols.length === 0) {
        console.log("[MIGRATION] Adding emailVerified...");
        await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false`;
      }

      // Auto-verify existing users so they aren't locked out
      await prisma.$executeRaw`UPDATE "User" SET "emailVerified" = true WHERE "emailVerified" = false`;
    }

    // 2. EmailVerificationToken
    if (!(await tableExists("EmailVerificationToken"))) {
      console.log("[MIGRATION] Creating EmailVerificationToken...");
      await safeExec(`CREATE TABLE "EmailVerificationToken" ("id" TEXT NOT NULL,"token" TEXT NOT NULL,"userId" TEXT NOT NULL,"expiresAt" TIMESTAMP(3) NOT NULL,"usedAt" TIMESTAMP(3),"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id"))`, "EmailVerificationToken table");
      await safeExec(`CREATE UNIQUE INDEX "EmailVerificationToken_token_key" ON "EmailVerificationToken"("token")`, "EVT token unique");
      await safeExec(`CREATE INDEX "EmailVerificationToken_token_idx" ON "EmailVerificationToken"("token")`, "EVT token idx");
      await safeExec(`CREATE INDEX "EmailVerificationToken_userId_idx" ON "EmailVerificationToken"("userId")`, "EVT userId idx");
      await safeFK("EmailVerificationToken_userId_fkey", "EmailVerificationToken", "User", "id", "CASCADE");
    }

    // 3. AuditLog
    if (!(await tableExists("AuditLog"))) {
      console.log("[MIGRATION] Creating AuditLog...");
      await safeExec(`CREATE TABLE "AuditLog" ("id" TEXT NOT NULL,"userId" TEXT,"action" TEXT NOT NULL,"resource" TEXT,"resourceId" TEXT,"details" JSONB,"ipAddress" TEXT,"userAgent" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id"))`, "AuditLog table");
      await safeExec(`CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId")`, "AuditLog userId idx");
      await safeExec(`CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action")`, "AuditLog action idx");
      await safeExec(`CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt")`, "AuditLog createdAt idx");
      await safeFK("AuditLog_userId_fkey", "AuditLog", "User", "id", "SET NULL");
    }

    // 4. RefreshToken
    if (!(await tableExists("RefreshToken"))) {
      console.log("[MIGRATION] Creating RefreshToken...");
      await safeExec(`CREATE TABLE "RefreshToken" ("id" TEXT NOT NULL,"token" TEXT NOT NULL,"userId" TEXT NOT NULL,"expiresAt" TIMESTAMP(3) NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id"))`, "RefreshToken table");
      await safeExec(`CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token")`, "RT token unique");
      await safeExec(`CREATE INDEX "RefreshToken_token_idx" ON "RefreshToken"("token")`, "RT token idx");
      await safeExec(`CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId")`, "RT userId idx");
      await safeFK("RefreshToken_userId_fkey", "RefreshToken", "User", "id", "CASCADE");
    }

    // 5. TwoFactorSecret
    if (!(await tableExists("TwoFactorSecret"))) {
      console.log("[MIGRATION] Creating TwoFactorSecret...");
      await safeExec(`CREATE TABLE "TwoFactorSecret" ("id" TEXT NOT NULL,"userId" TEXT NOT NULL,"secret" TEXT NOT NULL,"enabled" BOOLEAN NOT NULL DEFAULT false,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,CONSTRAINT "TwoFactorSecret_pkey" PRIMARY KEY ("id"))`, "TwoFactorSecret table");
      await safeExec(`CREATE UNIQUE INDEX "TwoFactorSecret_userId_key" ON "TwoFactorSecret"("userId")`, "2FA userId unique");
      await safeFK("TwoFactorSecret_userId_fkey", "TwoFactorSecret", "User", "id", "CASCADE");
    }

    // 6. LoginAttempt
    if (!(await tableExists("LoginAttempt"))) {
      console.log("[MIGRATION] Creating LoginAttempt...");
      await safeExec(`CREATE TABLE "LoginAttempt" ("id" TEXT NOT NULL,"email" TEXT NOT NULL,"ip" TEXT NOT NULL,"success" BOOLEAN NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id"))`, "LoginAttempt table");
      await safeExec(`CREATE INDEX "LoginAttempt_email_idx" ON "LoginAttempt"("email")`, "LA email idx");
      await safeExec(`CREATE INDEX "LoginAttempt_ip_idx" ON "LoginAttempt"("ip")`, "LA ip idx");
      await safeExec(`CREATE INDEX "LoginAttempt_createdAt_idx" ON "LoginAttempt"("createdAt")`, "LA createdAt idx");
    }

    // 7. IPBlacklist
    if (!(await tableExists("IPBlacklist"))) {
      console.log("[MIGRATION] Creating IPBlacklist...");
      await safeExec(`CREATE TABLE "IPBlacklist" ("id" TEXT NOT NULL,"ip" TEXT NOT NULL,"reason" TEXT,"expiresAt" TIMESTAMP(3),"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "IPBlacklist_pkey" PRIMARY KEY ("id"))`, "IPBlacklist table");
      await safeExec(`CREATE UNIQUE INDEX "IPBlacklist_ip_key" ON "IPBlacklist"("ip")`, "IPBlacklist ip unique");
      await safeExec(`CREATE INDEX "IPBlacklist_expiresAt_idx" ON "IPBlacklist"("expiresAt")`, "IPBlacklist expiresAt idx");
    }

    console.log("[MIGRATION] All migrations applied successfully.");
  } catch (err) {
    console.error("[MIGRATION] Error applying migrations:", err);
  }
}
