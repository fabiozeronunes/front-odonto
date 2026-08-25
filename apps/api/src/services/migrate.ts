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

    // 8. GradeSchedule
    if (!(await tableExists("GradeSchedule"))) {
      console.log("[MIGRATION] Creating GradeSchedule...");
      await safeExec(`CREATE TABLE "GradeSchedule" ("id" TEXT NOT NULL,"userId" TEXT NOT NULL,"name" TEXT NOT NULL,"period" INTEGER NOT NULL,"day" TEXT NOT NULL,"turma" TEXT NOT NULL DEFAULT '',"bloco" TEXT NOT NULL DEFAULT '',"sala" TEXT NOT NULL DEFAULT '',"curso" TEXT NOT NULL DEFAULT '',"turno" TEXT NOT NULL DEFAULT 'Noturno',"professor" TEXT NOT NULL DEFAULT '',"period1Start" TEXT NOT NULL DEFAULT '',"period1End" TEXT NOT NULL DEFAULT '',"period2Start" TEXT NOT NULL DEFAULT '',"period2End" TEXT NOT NULL DEFAULT '',"color" TEXT NOT NULL DEFAULT '',"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,CONSTRAINT "GradeSchedule_pkey" PRIMARY KEY ("id"))`, "GradeSchedule table");
      await safeExec(`CREATE INDEX "GradeSchedule_userId_idx" ON "GradeSchedule"("userId")`, "GradeSchedule userId idx");
      await safeFK("GradeSchedule_userId_fkey", "GradeSchedule", "User", "id", "CASCADE");
    }

    // 9. RefreshToken ipAddress/userAgent columns
    if (await tableExists("RefreshToken")) {
      const rtCols = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'RefreshToken' AND column_name = 'ipAddress'` as any[];
      if (rtCols.length === 0) {
        console.log("[MIGRATION] Adding ipAddress/userAgent to RefreshToken...");
        await prisma.$executeRaw`ALTER TABLE "RefreshToken" ADD COLUMN "ipAddress" TEXT`;
        await prisma.$executeRaw`ALTER TABLE "RefreshToken" ADD COLUMN "userAgent" TEXT`;
      }
    }

    // 10. Video recorded* columns (aula gravada separada do embed YouTube)
    if (await tableExists("Video")) {
      const videoCols = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'Video' AND column_name IN ('recordedUrl','recordedTitle','recordedDate','recordedTime','recordedOrientation')` as any[];
      const existing = new Set(videoCols.map((c: any) => c.column_name));
      if (!existing.has("recordedUrl")) {
        console.log("[MIGRATION] Adding recorded* columns to Video...");
        await prisma.$executeRaw`ALTER TABLE "Video" ADD COLUMN "recordedUrl" TEXT`;
      }
      if (!existing.has("recordedTitle")) {
        await prisma.$executeRaw`ALTER TABLE "Video" ADD COLUMN "recordedTitle" TEXT`;
      }
      if (!existing.has("recordedDate")) {
        await prisma.$executeRaw`ALTER TABLE "Video" ADD COLUMN "recordedDate" TEXT`;
      }
      if (!existing.has("recordedTime")) {
        await prisma.$executeRaw`ALTER TABLE "Video" ADD COLUMN "recordedTime" TEXT`;
      }
      if (!existing.has("recordedOrientation")) {
        await prisma.$executeRaw`ALTER TABLE "Video" ADD COLUMN "recordedOrientation" TEXT`;
      }
    }

    // 11. Disciplinas/Curso (Meu espaço)
    if (await tableExists("CourseDiscipline")) {
      for (const col of ["curso", "codigo", "diaSemana", "periodo", "turno", "professor", "turma", "bloco", "sala"]) {
        const cdCol = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'CourseDiscipline' AND column_name = ${col}` as any[];
        if (cdCol.length === 0) {
          await prisma.$executeRawUnsafe(`ALTER TABLE "CourseDiscipline" ADD COLUMN "${col}" TEXT`);
        }
      }
    }
    if (!(await tableExists("CourseDiscipline"))) {
      console.log("[MIGRATION] Creating CourseDiscipline...");
      await safeExec(`CREATE TABLE "CourseDiscipline" ("id" TEXT NOT NULL,"userId" TEXT NOT NULL,"name" TEXT NOT NULL,"curso" TEXT,"periodo" TEXT,"professor" TEXT,"turma" TEXT,"bloco" TEXT,"sala" TEXT,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "CourseDiscipline_pkey" PRIMARY KEY ("id"))`, "CourseDiscipline table");
      await safeExec(`CREATE INDEX "CourseDiscipline_userId_idx" ON "CourseDiscipline"("userId")`, "CourseDiscipline userId idx");
      await safeFK("CourseDiscipline_userId_fkey", "CourseDiscipline", "User", "id", "CASCADE");
    }
    if (await tableExists("User")) {
      const uCols = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'curso'` as any[];
      if (uCols.length === 0) {
        await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN "curso" TEXT`;
      }
    }
    for (const [table, col] of [
      ["Video", "disciplina"],
      ["Video", "curso"],
      ["Video", "recordedDisciplina"],
      ["Video", "recordedCurso"],
      ["VideoAudio", "disciplina"],
      ["VideoAudio", "curso"],
    ] as const) {
      const colRes = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = ${table} AND column_name = ${col}` as any[];
      if (colRes.length === 0) {
        await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN "${col}" TEXT`);
      }
    }

    console.log("[MIGRATION] All migrations applied successfully.");
  } catch (err) {
    console.error("[MIGRATION] Error applying migrations:", err);
  }
}
