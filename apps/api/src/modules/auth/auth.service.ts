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
import type { RegisterInput, LoginInput } from "./auth.validators.js";

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

function publicUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  planId: string;
  registrationNumber?: string | null;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    planId: user.planId,
    registrationNumber: user.registrationNumber ?? null,
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

export async function registerUser(input: RegisterInput) {
  const exists = await prisma.user.findUnique({ where: { email: input.email } });
  if (exists) {
    throw new ConflictError("E-mail já cadastrado");
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
    select: { id: true, name: true, email: true, role: true, planId: true, registrationNumber: true },
  });

  return {
    user: publicUser(user),
    tokens: issueTokens(user),
  };
}

export function issueTokens(user: { id: string; email: string; role: string; planId: string; tokenVersion?: number }) {
  return {
    accessToken: signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role as "ADMIN" | "USER",
      planId: user.planId,
    }),
    refreshToken: signRefreshToken({ sub: user.id, tokenVersion: user.tokenVersion ?? 0 }),
  };
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, name: true, email: true, role: true, planId: true, registrationNumber: true, passwordHash: true, isActive: true, tokenVersion: true },
  });

  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new UnauthorizedError("Credenciais inválidas");
  }

  if (!user.isActive) {
    throw new UnauthorizedError("Conta inativa. Contate o suporte.");
  }

  const { passwordHash: _ph, ...safeUser } = user;
  return { user: publicUser(safeUser), tokens: issueTokens(safeUser) };
}

export async function refreshAccess(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new UnauthorizedError("Refresh token inválido ou expirado");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, name: true, email: true, role: true, planId: true, registrationNumber: true, isActive: true, tokenVersion: true },
  });

  if (!user || !user.isActive) {
    throw new UnauthorizedError("Usuário inexistente ou inativo");
  }

  if (user.tokenVersion !== payload.tokenVersion) {
    throw new UnauthorizedError("Sessão expirada. Faça login novamente.");
  }

  return {
    accessToken: signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      planId: user.planId,
    }),
  };
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      registrationNumber: true,
      isAffiliate: true,
      affiliateCode: true,
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
      id: true,
      name: true,
      email: true,
      role: true,
      registrationNumber: true,
      isAffiliate: true,
      affiliateCode: true,
      plan: { select: { id: true, name: true, slug: true, price: true, billing: true } },
      createdAt: true,
    },
  });
  return user;
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true, tokenVersion: true },
  });
  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw new UnauthorizedError("Senha atual incorreta");
  }
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      tokenVersion: { increment: 1 },
    },
  });
  return { ok: true };
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { ok: true };
  }

  // Invalidate any existing reset tokens for this user
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  // Generate a cryptographically secure single-use token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
    },
  });

  // TODO: Send email with reset link containing the token
  // For now, log it for development purposes only
  console.log(`[PASSWORD RESET] Token for ${email}: ${token}`);

  return { ok: true };
}

export async function resetPassword(token: string, newPassword: string) {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken) {
    throw new UnauthorizedError("Token inválido ou expirado");
  }

  if (resetToken.usedAt) {
    throw new UnauthorizedError("Token já utilizado. Solicite um novo.");
  }

  if (resetToken.expiresAt < new Date()) {
    throw new UnauthorizedError("Token expirado. Solicite um novo.");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: {
        passwordHash,
        tokenVersion: { increment: 1 },
      },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { ok: true };
}
