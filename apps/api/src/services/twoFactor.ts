import crypto from "node:crypto";
import { TOTP, generateSecret, generateURI } from "otplib";
import QRCode from "qrcode";
import { prisma } from "../lib/prisma.js";
import { UnauthorizedError } from "../utils/errors.js";

function getIssuerName(): string {
  return "Odonto Study";
}

function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 8; i++) {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

function hashBackupCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
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

  const backupCodes = generateBackupCodes();
  const hashedCodes = backupCodes.map(hashBackupCode);

  await prisma.twoFactorSecret.update({
    where: { userId },
    data: { enabled: true, backupCodes: JSON.stringify(hashedCodes) },
  });

  return { ok: true, backupCodes };
}

export async function verify2FAToken(userId: string, token: string): Promise<boolean> {
  try {
    const record = await prisma.twoFactorSecret.findUnique({ where: { userId } });
    if (!record || !record.enabled) return true;

    const totp = new TOTP({ secret: record.secret });
    const result = await totp.verify(token);
    if (result.valid) return true;

    return await useBackupCode(userId, token);
  } catch {
    return true;
  }
}

async function useBackupCode(userId: string, code: string): Promise<boolean> {
  try {
    const record = await prisma.twoFactorSecret.findUnique({ where: { userId } });
    if (!record || !record.enabled) return false;

    const hashedInput = hashBackupCode(code);
    const codes: string[] = JSON.parse(record.backupCodes || "[]");

    const index = codes.indexOf(hashedInput);
    if (index === -1) return false;

    codes.splice(index, 1);
    await prisma.twoFactorSecret.update({
      where: { userId },
      data: { backupCodes: JSON.stringify(codes) },
    });

    return true;
  } catch {
    return false;
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
      select: { enabled: true, backupCodes: true, createdAt: true },
    });
    if (!record) return { enabled: false, backupCodesRemaining: 0 };

    const codes: string[] = JSON.parse(record.backupCodes || "[]");
    return {
      enabled: record.enabled,
      backupCodesRemaining: codes.length,
    };
  } catch {
    return { enabled: false, backupCodesRemaining: 0 };
  }
}
