import { z } from "zod";

const passwordValidation = z
  .string()
  .min(8, "Senha deve ter ao menos 8 caracteres")
  .max(72)
  .regex(/[A-Z]/, "Senha deve conter ao menos 1 letra maiúscula")
  .regex(/[a-z]/, "Senha deve conter ao menos 1 letra minúscula")
  .regex(/[0-9]/, "Senha deve conter ao menos 1 número");

export const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres").max(120),
  email: z.string().email("E-mail inválido"),
  phone: z.string().max(20).optional().nullable(),
  password: passwordValidation,
  ref: z.string().max(60).optional().nullable(),
});

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Token obrigatório"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual obrigatória"),
  newPassword: passwordValidation,
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token obrigatório"),
  newPassword: passwordValidation,
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres").max(120),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token obrigatório"),
});

export const resendVerificationSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

export const twoFactorSetupSchema = z.object({});

export const twoFactorVerifySchema = z.object({
  token: z.string().length(6, "Código deve ter 6 dígitos"),
});

export const twoFactorDisableSchema = z.object({
  token: z.string().length(6, "Código deve ter 6 dígitos"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
