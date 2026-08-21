import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../../utils/errors.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt.js";
import { env } from "../../config/env.js";
import { sendEmail, buildPasswordResetEmail, buildEmailVerificationEmail } from "../../services/email.js";
import { isPasswordBreached } from "../../services/breach.js";
import type { RegisterInput, LoginInput } from "./auth.validators.js";

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function publicUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  planId: string;
  registrationNumber?: string | null;
  emailVerified?: boolean;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    planId: user.planId,
    registrationNumber: user.registrationNumber ?? null,
    emailVerified: user.emailVerified ?? false,
  };
}

async function generateRegistrationNumber(): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = String(Math.floor(100000 + Math.random() * 900000));
    const exists = await prisma.user.findUnique({
      where: { registrationNumber: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
  }
  throw new Error("Não foi possível gerar um número de matrícula único");
}

async function getFreePlanId() {
  const plan = await prisma.membershipPlan.findUnique({
    where: { slug: "gratuito" },
  });
  if (!plan) {
    throw new Error("Plano gratuito não configurado. Execute o seed.");
  }
  return plan.id;
}

async function createRefreshToken(userId: string, ip?: string): Promise<string> {
  const token = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  try {
    await prisma.refreshToken.create({
      data: { token, userId, expiresAt },
    });
  } catch (err) {
    console.warn("[REFRESH] Could not persist refresh token:", err);
  }

  return token;
}

async function checkAccountLockout(email: string, ip: string): Promise<void> {
  try {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentAttempts = await prisma.loginAttempt.findMany({
      where: {
        OR: [{ email }, { ip }],
        success: false,
        createdAt: { gte: fiveMinAgo },
      },
      orderBy: { createdAt: "desc" },
      take: MAX_LOGIN_ATTEMPTS,
    });

    if (recentAttempts.length >= MAX_LOGIN_ATTEMPTS) {
      const oldestAttempt = recentAttempts[recentAttempts.length - 1];
      const lockoutEnd = new Date(oldestAttempt.createdAt.getTime() + LOCKOUT_DURATION_MS);
      if (new Date() < lockoutEnd) {
        const remainingMinutes = Math.ceil((lockoutEnd.getTime() - Date.now()) / 60000);
        throw new UnauthorizedError(
          `Conta bloqueada temporariamente. Tente novamente em ${remainingMinutes} minutos.`
        );
      }
    }
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err;
    console.warn("[LOCKOUT] Table may not exist yet, skipping lockout check");
  }
}

async function recordLoginAttempt(email: string, ip: string, success: boolean): Promise<void> {
  try {
    await prisma.loginAttempt.create({
      data: { email, ip, success },
    });
  } catch (err) {
    console.warn("[LOCKOUT] Could not record login attempt:", err);
  }
}

async function cleanupOldAttempts(): Promise<void> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  await prisma.loginAttempt.deleteMany({
    where: { createdAt: { lt: oneHourAgo } },
  });
}

export async function registerUser(input: RegisterInput) {
  const exists = await prisma.user.findUnique({ where: { email: input.email } });
  if (exists) {
    throw new ConflictError("E-mail já cadastrado");
  }

  const breached = await isPasswordBreached(input.password);
  if (breached.breached) {
    throw new ConflictError(`Esta senha foi exposta em ${breached.count.toLocaleString()} vazamentos. Escolha outra senha.`);
  }

  const planId = await getFreePlanId();
  const passwordHash = await bcrypt.hash(input.password, 10);

  let referredById: string | null = null;
  if (input.ref) {
    const affiliate = await prisma.user.findUnique({
      where: { affiliateCode: input.ref },
      select: { id: true, isAffiliate: true },
    });
    if (affiliate?.isAffiliate) {
      referredById = affiliate.id;
    }
  }

  const registrationNumber = await generateRegistrationNumber();

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      passwordHash,
      planId,
      referredById,
      registrationNumber,
    },
    select: { id: true, name: true, email: true, role: true, planId: true, registrationNumber: true, emailVerified: true },
  });

  const verificationToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.emailVerificationToken.create({
    data: { token: verificationToken, userId: user.id, expiresAt },
  });

  const verifyUrl = `${env.webUrl}/verify-email?token=${verificationToken}`;
  const { subject, html } = buildEmailVerificationEmail(verifyUrl);
  await sendEmail({ to: user.email, subject, html });

  const refreshToken = await createRefreshToken(user.id);

  return {
    user: publicUser(user),
    tokens: {
      accessToken: signAccessToken({
        sub: user.id,
        email: user.email,
        role: user.role as "ADMIN" | "USER",
        planId: user.planId,
      }),
      refreshToken,
    },
  };
}

export async function loginUser(input: LoginInput, ip?: string) {
  const clientIp = ip || "unknown";

  await checkAccountLockout(input.email, clientIp);

  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, name: true, email: true, role: true, planId: true, registrationNumber: true, passwordHash: true, isActive: true, emailVerified: true, tokenVersion: true },
  });

  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    await recordLoginAttempt(input.email, clientIp, false);
    throw new UnauthorizedError("Credenciais inválidas");
  }

  if (!user.isActive) {
    throw new UnauthorizedError("Conta inativa. Contate o suporte.");
  }

  if (!user.emailVerified) {
    throw new UnauthorizedError("E-mail não verificado. Verifique sua caixa de entrada.");
  }

  await recordLoginAttempt(input.email, clientIp, true);
  cleanupOldAttempts().catch(() => {});

  const { passwordHash: _ph, ...safeUser } = user;
  const refreshToken = await createRefreshToken(user.id);

  return {
    user: publicUser(safeUser),
    tokens: {
      accessToken: signAccessToken({
        sub: user.id,
        email: user.email,
        role: user.role,
        planId: user.planId,
      }),
      refreshToken,
    },
  };
}

export async function refreshAccess(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new UnauthorizedError("Refresh token inválido ou expirado");
  }

  const dbToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: { select: { id: true, name: true, email: true, role: true, planId: true, registrationNumber: true, isActive: true, tokenVersion: true } } },
  });

  if (!dbToken) {
    throw new UnauthorizedError("Refresh token não encontrado");
  }

  if (dbToken.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: dbToken.id } });
    throw new UnauthorizedError("Refresh token expirado. Faça login novamente.");
  }

  const user = dbToken.user;

  if (!user || !user.isActive) {
    await prisma.refreshToken.delete({ where: { id: dbToken.id } });
    throw new UnauthorizedError("Usuário inexistente ou inativo");
  }

  if (user.tokenVersion !== payload.tokenVersion) {
    await prisma.refreshToken.delete({ where: { id: dbToken.id } });
    throw new UnauthorizedError("Sessão expirada. Faça login novamente.");
  }

  // Rotate: delete old, create new
  await prisma.refreshToken.delete({ where: { id: dbToken.id } });
  const newRefreshToken = await createRefreshToken(user.id);

  return {
    accessToken: signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      planId: user.planId,
    }),
    refreshToken: newRefreshToken,
  };
}

export async function logoutUser(refreshToken: string) {
  try {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  } catch {}
  return { ok: true };
}

export async function logoutAllDevices(userId: string) {
  await prisma.refreshToken.deleteMany({ where: { userId } });
  return { ok: true };
}

export async function verifyEmail(token: string) {
  const verificationToken = await prisma.emailVerificationToken.findUnique({ where: { token } });

  if (!verificationToken) {
    throw new UnauthorizedError("Token de verificação inválido");
  }
  if (verificationToken.usedAt) {
    throw new UnauthorizedError("Token de verificação já utilizado");
  }
  if (verificationToken.expiresAt < new Date()) {
    throw new UnauthorizedError("Token de verificação expirado. Solicite um novo.");
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: verificationToken.userId }, data: { emailVerified: true } }),
    prisma.emailVerificationToken.update({ where: { id: verificationToken.id }, data: { usedAt: new Date() } }),
  ]);

  return { ok: true };
}

export async function resendVerificationEmail(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { ok: true };
  if (user.emailVerified) return { ok: true };

  await prisma.emailVerificationToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } });

  const verificationToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.emailVerificationToken.create({ data: { token: verificationToken, userId: user.id, expiresAt } });

  const verifyUrl = `${env.webUrl}/verify-email?token=${verificationToken}`;
  const { subject, html } = buildEmailVerificationEmail(verifyUrl);
  await sendEmail({ to: email, subject, html });

  return { ok: true };
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, role: true, registrationNumber: true,
      isAffiliate: true, affiliateCode: true, emailVerified: true,
      plan: { select: { id: true, name: true, slug: true, price: true, billing: true } },
      createdAt: true,
    },
  });
  if (!user) throw new NotFoundError("Usuário não encontrado");
  return user;
}

export async function updateProfile(userId: string, name: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { name },
    select: {
      id: true, name: true, email: true, role: true, registrationNumber: true,
      isAffiliate: true, affiliateCode: true, emailVerified: true,
      plan: { select: { id: true, name: true, slug: true, price: true, billing: true } },
      createdAt: true,
    },
  });
  return user;
}

export async function revokeAllRefreshTokens(userId: string) {
  await prisma.refreshToken.deleteMany({ where: { userId } });
  return { ok: true };
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true, tokenVersion: true },
  });
  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw new UnauthorizedError("Senha atual incorreta");
  }

  const breached = await isPasswordBreached(newPassword);
  if (breached.breached) {
    throw new ConflictError(`Esta senha foi exposta em ${breached.count.toLocaleString()} vazamentos. Escolha outra senha.`);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash, tokenVersion: { increment: 1 } } }),
    prisma.refreshToken.deleteMany({ where: { userId } }),
  ]);
  return { ok: true };
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { ok: true };

  await prisma.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

  await prisma.passwordResetToken.create({ data: { token, userId: user.id, expiresAt } });

  const resetUrl = `${env.webUrl}/reset-password?token=${token}`;
  const { subject, html } = buildPasswordResetEmail(resetUrl);
  await sendEmail({ to: email, subject, html });

  return { ok: true };
}

export async function resetPassword(token: string, newPassword: string) {
  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });

  if (!resetToken) throw new UnauthorizedError("Token inválido ou expirado");
  if (resetToken.usedAt) throw new UnauthorizedError("Token já utilizado. Solicite um novo.");
  if (resetToken.expiresAt < new Date()) throw new UnauthorizedError("Token expirado. Solicite um novo.");

  const breached = await isPasswordBreached(newPassword);
  if (breached.breached) {
    throw new ConflictError(`Esta senha foi exposta em ${breached.count.toLocaleString()} vazamentos. Escolha outra senha.`);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash, tokenVersion: { increment: 1 } } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
    prisma.refreshToken.deleteMany({ where: { userId: resetToken.userId } }),
  ]);

  return { ok: true };
}
