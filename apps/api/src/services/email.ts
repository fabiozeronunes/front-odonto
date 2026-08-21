import { Resend } from "resend";
import { env } from "../config/env.js";

let resendClient: Resend | null = null;

function getClient(): Resend | null {
  if (!env.resendApiKey) return null;
  if (!resendClient) {
    resendClient = new Resend(env.resendApiKey);
  }
  return resendClient;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const client = getClient();
  if (!client) {
    console.warn("[EMAIL] Resend API key not configured. Email not sent.");
    console.log(`[EMAIL] To: ${options.to}`);
    console.log(`[EMAIL] Subject: ${options.subject}`);
    console.log(`[EMAIL] Body preview: ${options.html.substring(0, 200)}...`);
    return false;
  }

  try {
    await client.emails.send({
      from: env.emailFrom || "noreply@odonto.study",
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    return true;
  } catch (err) {
    console.error("[EMAIL] Failed to send:", err);
    return false;
  }
}

export function buildPasswordResetEmail(resetUrl: string): { subject: string; html: string } {
  return {
    subject: "Redefinição de senha — Odonto Study",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          h1 { color: #1a1a2e; font-size: 24px; margin-bottom: 20px; }
          p { color: #555; line-height: 1.6; margin-bottom: 16px; }
          .button { display: inline-block; background: #6c5ce7; color: white !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
          .warning { background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 12px; color: #856404; font-size: 13px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Redefinição de senha</h1>
          <p>Olá!</p>
          <p>Você solicitou a redefinição da sua senha no <strong>Odonto Study</strong>.</p>
          <p>Clique no botão abaixo para criar uma nova senha:</p>
          <a href="${resetUrl}" class="button">Redefinir senha</a>
          <div class="warning">
            ⏳ Este link expira em <strong>1 hora</strong> e pode ser usado apenas <strong>uma vez</strong>.
          </div>
          <p>Se você não solicitou esta alteração, ignore este email. Sua senha permanecerá a mesma.</p>
          <div class="footer">
            <p>Este é um email automático. Por favor, não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
}

export function buildEmailVerificationEmail(verifyUrl: string): { subject: string; html: string } {
  return {
    subject: "Verifique seu email — Odonto Study",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          h1 { color: #1a1a2e; font-size: 24px; margin-bottom: 20px; }
          p { color: #555; line-height: 1.6; margin-bottom: 16px; }
          .button { display: inline-block; background: #00b894; color: white !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Bem-vindo ao Odonto Study!</h1>
          <p>Obrigado por se cadastrar. Para ativar sua conta, verifique seu email clicando no botão abaixo:</p>
          <a href="${verifyUrl}" class="button">Verificar email</a>
          <p>Se você não criou esta conta, ignore este email.</p>
          <div class="footer">
            <p>Este é um email automático. Por favor, não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
}
