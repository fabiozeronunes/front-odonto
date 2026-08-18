import { prisma } from "../../lib/prisma.js";
import type { Prisma } from "@prisma/client";
import { BadRequestError, ConflictError } from "../../utils/errors.js";
import { decryptApiKey } from "../study/study.service.js";

export async function getSiteSetting(key: string) {
  const row = await prisma.siteSetting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function upsertSiteSetting(key: string, value: string) {
  const row = await prisma.siteSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  return row.value;
}

export async function getPaymentSettings() {
  const row = await prisma.siteSetting.findUnique({ where: { key: "payment" } });
  return (row?.value as Record<string, unknown> | null) ?? null;
}

export async function upsertPaymentSettings(data: Record<string, unknown>) {
  const row = await prisma.siteSetting.upsert({
    where: { key: "payment" },
    update: { value: data as Prisma.InputJsonValue },
    create: { key: "payment", value: data as Prisma.InputJsonValue },
  });
  return row.value;
}

export interface HeroContent {
  title: string;
  subtitle: string;
  businessArea: string;
  tags: string;
}

export async function getHeroContent(): Promise<HeroContent> {
  const value = await getSiteSetting("heroContent");
  const fallback: HeroContent = {
    title: "Domine a Odontologia Estudando por Vídeos, Imagens e Estudos de Casos.",
    subtitle:
      "Aprenda por especialidades, estude casos reais e evolua com Quizz, Flashcards e Questionários que vão ajudar na sua formação e aprendizado.",
    businessArea: "",
    tags: "",
  };
  if (!value) return fallback;
  try {
    const raw = typeof value === "string" ? JSON.parse(value) : value;
    return {
      title: typeof raw.title === "string" && raw.title ? raw.title : fallback.title,
      subtitle: typeof raw.subtitle === "string" && raw.subtitle ? raw.subtitle : fallback.subtitle,
      businessArea: typeof raw.businessArea === "string" ? raw.businessArea : "",
      tags: typeof raw.tags === "string" ? raw.tags : "",
    };
  } catch {
    return fallback;
  }
}

export async function saveHeroContent(input: Partial<HeroContent>) {
  const current = await getHeroContent();
  const next: HeroContent = {
    title: typeof input.title === "string" && input.title.trim() ? input.title.trim() : current.title,
    subtitle:
      typeof input.subtitle === "string" && input.subtitle.trim() ? input.subtitle.trim() : current.subtitle,
    businessArea: typeof input.businessArea === "string" ? input.businessArea.trim() : current.businessArea,
    tags: typeof input.tags === "string" ? input.tags.trim() : current.tags,
  };
  await upsertSiteSetting("heroContent", JSON.stringify(next));
  return next;
}

async function getAdminGeminiKey(): Promise<string> {
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
    select: { geminiApiKey: true },
  });
  if (!admin?.geminiApiKey) {
    throw new ConflictError(
      "Nenhuma chave Gemini configurada no admin. Configure em Dados de estudo."
    );
  }
  return decryptApiKey(admin.geminiApiKey);
}

async function callGeminiJson(apiKey: string, prompt: string): Promise<unknown> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.8 },
      }),
    }
  );
  if (!res.ok) {
    const body = await res.text();
    let message = `Erro na API Gemini (${res.status})`;
    try {
      const parsed = JSON.parse(body) as { error?: { message?: string } };
      message = parsed.error?.message ?? message;
    } catch {
      /* keep generic message */
    }
    throw new BadRequestError(message.slice(0, 300));
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text) throw new BadRequestError("A API Gemini não retornou conteúdo");
  try {
    return JSON.parse(text.replace(/^```json\s*|```$/g, ""));
  } catch {
    throw new BadRequestError("A API Gemini retornou conteúdo inválido");
  }
}

export interface HeroSuggestion {
  trigger: string;
  title: string;
  subtitle: string;
}

export async function generateHeroSuggestions(input: {
  businessArea: string;
  tags: string;
  count?: number;
}): Promise<HeroSuggestion[]> {
  const businessArea = (input.businessArea ?? "").trim();
  const tags = (input.tags ?? "").trim();
  const count = Math.min(Math.max(Number(input.count) || 5, 1), 10);

  const prompt =
    `Você é um copywriter especialista em marketing digital odontológico. ` +
    `O site é uma plataforma de estudos odontológicos (vídeos, imagens e estudos de caso para estudantes e profissionais de odontologia).\n` +
    `Ramo de atividade informado: ${businessArea || "odontologia / educação odontológica"}\n` +
    `Tags: ${tags || "odontologia, estudo, concurso, residência, preparação"}\n` +
    `Gere ${count} opções de TÍTULO e SUBTÍTULO (headline e subheadline) para a seção hero da página inicial, ` +
    `cada uma baseada em um GATILHO MENTAL diferente entre: escassez, urgência, autoridade, prova social, curiosidade, desejo, medo de perda, novidade, antecipação, exclusividade.\n` +
    `O título deve ter no máximo 60 caracteres, com impacto e foco no resultado do aluno. O subtítulo no máximo 140 caracteres, complementando a promessa.\n` +
    `Responda APENAS em JSON no formato: {"options":[{"trigger":"nome do gatilho","title":"...","subtitle":"..."}]}`;

  const apiKey = await getAdminGeminiKey();
  const parsed = (await callGeminiJson(apiKey, prompt)) as { options?: HeroSuggestion[] };
  const options = Array.isArray(parsed?.options) ? parsed.options : [];
  if (!options.length) {
    throw new BadRequestError("A IA não gerou sugestões. Tente novamente.");
  }
  return options
    .filter((o) => o && typeof o.title === "string" && typeof o.subtitle === "string")
    .slice(0, count);
}
