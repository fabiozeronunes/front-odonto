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

function publicUser(user: { id: string; name: string; email: string; role: string; planId: string }) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    planId: user.planId,
  };
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

  const freePlanId = await getFreePlanId();
  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      planId: freePlanId,
    },
    select: { id: true, name: true, email: true, role: true, planId: true },
  });

  return {
    user: publicUser(user),
    tokens: issueTokens(user),
  };
}

export function issueTokens(user: { id: string; email: string; role: string; planId: string }) {
  return {
    accessToken: signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role as "ADMIN" | "USER",
      planId: user.planId,
    }),
    refreshToken: signRefreshToken({ sub: user.id, tokenVersion: 1 }),
  };
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, name: true, email: true, role: true, planId: true, passwordHash: true, isActive: true },
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
    select: { id: true, name: true, email: true, role: true, planId: true, isActive: true },
  });

  if (!user || !user.isActive) {
    throw new UnauthorizedError("Usuário inexistente ou inativo");
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
      plan: { select: { id: true, name: true, slug: true, price: true, billing: true } },
      createdAt: true,
    },
  });
  return user;
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw new UnauthorizedError("Senha atual incorreta");
  }
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  return { ok: true };
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { ok: true };
  }
  const token = signRefreshToken({ sub: user.id, tokenVersion: 1 });
  return { ok: true, resetToken: token };
}

export async function resetPassword(token: string, newPassword: string) {
  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new UnauthorizedError("Token inválido ou expirado");
  }
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: payload.sub },
    data: { passwordHash },
  });
  return { ok: true };
}
