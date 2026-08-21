import crypto from "node:crypto";
import { TOTP, generateSecret, generateURI } from "otplib";
import QRCode from "qrcode";
import { prisma } from "../lib/prisma.js";
import { UnauthorizedError } from "../utils/errors.js";

function getIssuerName(): string {
  return "Odonto Study";
}

export async function generateTwoFactorSecret(userId: string, email: string) {
  const secret = generateSecret();

  const otpauth = generateURI({
    issuer: getIssuerName(),
    label: email,
    secret,
  });

  const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

  try {
    const existing = await prisma.twoFactorSecret.findUnique({ where: { userId } });
    if (existing) {
      await prisma.twoFactorSecret.update({ where: { userId }, data: { secret, enabled: false } });
    } else {
      await prisma.twoFactorSecret.create({ data: { userId, secret, enabled: false } });
    }
  } catch {
    console.warn("[2FA] TwoFactorSecret table may not exist yet");
  }

  return { secret, qrCode: qrCodeDataUrl, otpauth };
}

export async function verifyAndEnable2FA(userId: string, token: string) {
  let record;
  try {
    record = await prisma.twoFactorSecret.findUnique({ where: { userId } });
  } catch {
    throw new UnauthorizedError("2FA não disponível no momento. Tente novamente mais tarde.");
  }
  if (!record) throw new UnauthorizedError("2FA não configurado. Gere um novo segredo.");

  const totp = new TOTP({ secret: record.secret });
  const result = await totp.verify(token);

  if (!result.valid) throw new UnauthorizedError("Código OTP inválido. Tente novamente.");

  await prisma.twoFactorSecret.update({ where: { userId }, data: { enabled: true } });
  return { ok: true };
}

export async function verify2FAToken(userId: string, token: string): Promise<boolean> {
  try {
    const record = await prisma.twoFactorSecret.findUnique({ where: { userId } });
    if (!record || !record.enabled) return true;

    const totp = new TOTP({ secret: record.secret });
    const result = await totp.verify(token);
    return result.valid;
  } catch {
    return true;
  }
}

export async function disable2FA(userId: string, token: string) {
  let record;
  try {
    record = await prisma.twoFactorSecret.findUnique({ where: { userId } });
  } catch {
    throw new UnauthorizedError("2FA não disponível no momento.");
  }
  if (!record || !record.enabled) throw new UnauthorizedError("2FA não está habilitado.");

  const totp = new TOTP({ secret: record.secret });
  const result = await totp.verify(token);

  if (!result.valid) throw new UnauthorizedError("Código OTP inválido.");

  await prisma.twoFactorSecret.delete({ where: { userId } });
  return { ok: true };
}

export async function get2FAStatus(userId: string) {
  try {
    const record = await prisma.twoFactorSecret.findUnique({
      where: { userId },
      select: { enabled: true, createdAt: true },
    });
    return { enabled: record?.enabled ?? false };
  } catch {
    return { enabled: false };
  }
}
