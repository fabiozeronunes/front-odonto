import { prisma } from "../lib/prisma.js";

/**
 * Apply pending migrations on startup.
 * This is a temporary solution until Prisma migration tracking is properly set up.
 */
export async function applyMigrations() {
  try {
    // First, find the actual table names by checking information_schema
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    ` as { table_name: string }[];
    
    const tableNames = new Set(tables.map(t => t.table_name));
    console.log(`[MIGRATION] Found tables: ${Array.from(tableNames).join(', ')}`);

    // Check if emailVerified column exists in users table (check both cases)
    const userTable = tableNames.has('User') ? 'User' : tableNames.has('users') ? 'users' : null;
    
    if (userTable) {
      const hasEmailVerified = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = ${userTable} AND column_name = 'emailVerified'
        ) as exists
      ` as { exists: boolean }[];

      if (!hasEmailVerified[0]?.exists) {
        console.log(`[MIGRATION] Adding emailVerified column to ${userTable}...`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "${userTable}" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false`);
        console.log("[MIGRATION] emailVerified column added.");
      }
    }

    // Check if emailVerificationTokens table exists (check both cases)
    const hasEmailVerificationTokens = tableNames.has('emailVerificationTokens') || 
                                       tableNames.has('EmailVerificationToken');
    
    if (!hasEmailVerificationTokens) {
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
      
      // Try to add foreign key with the correct user table name
      if (userTable) {
        try {
          await prisma.$executeRawUnsafe(`
            ALTER TABLE "emailVerificationTokens" ADD CONSTRAINT "emailVerificationTokens_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "${userTable}"("id") ON DELETE CASCADE ON UPDATE CASCADE
          `);
        } catch (e) {
          console.log("[MIGRATION] Foreign key constraint skipped (might already exist)");
        }
      }
      console.log("[MIGRATION] emailVerificationTokens table created.");
    }

    // Check if auditLogs table exists
    const hasAuditLogs = tableNames.has('auditLogs') || 
                         tableNames.has('AuditLog');
    
    if (!hasAuditLogs) {
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
      
      // Try to add foreign key with the correct user table name
      if (userTable) {
        try {
          await prisma.$executeRawUnsafe(`
            ALTER TABLE "auditLogs" ADD CONSTRAINT "auditLogs_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "${userTable}"("id") ON DELETE SET NULL ON UPDATE CASCADE
          `);
        } catch (e) {
          console.log("[MIGRATION] Foreign key constraint skipped (might already exist)");
        }
      }
      console.log("[MIGRATION] auditLogs table created.");
    }

    console.log("[MIGRATION] All migrations applied successfully.");
  } catch (err) {
    console.error("[MIGRATION] Error applying migrations:", err);
    // Don't crash the server, just log the error
  }
}
