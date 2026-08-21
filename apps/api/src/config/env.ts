import dotenv from "dotenv";

dotenv.config();

const INSECURE_DEFAULTS = [
  "dev_jwt_secret_change_me",
  "dev_jwt_refresh_secret_change_me",
  "change_me",
  "secret",
  "password",
];

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória não definida: ${name}`);
  }
  return value;
}

function requireSecure(name: string): string {
  const value = required(name);
  if (INSECURE_DEFAULTS.includes(value.toLowerCase())) {
    throw new Error(
      `Variável ${name} contém um valor inseguro/padrão. Gere um segredo forte (min. 32 caracteres aleatórios).`
    );
  }
  if (value.length < 32) {
    throw new Error(
      `Variável ${name} deve ter pelo menos 32 caracteres. Valor atual muito curto.`
    );
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: requireSecure("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "15m",
  jwtRefreshSecret: requireSecure("JWT_REFRESH_SECRET"),
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  apiUrl: process.env.API_URL ?? "http://localhost:4000",
  webUrl: process.env.WEB_URL ?? "http://localhost:5173",
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX ?? 120),
  whatsappApiUrl: process.env.WHATSAPP_API_URL ?? "",
  whatsappApiToken: process.env.WHATSAPP_API_TOKEN ?? "",
  paymentGateway: process.env.PAYMENT_GATEWAY ?? "",
  paymentGatewaySecret: process.env.PAYMENT_GATEWAY_SECRET ?? "",
  paymentGatewayPublicKey: process.env.PAYMENT_GATEWAY_PUBLIC_KEY ?? "",
  encryptionKey: process.env.ENCRYPTION_KEY ?? "",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "noreply@odonto.study",
};
