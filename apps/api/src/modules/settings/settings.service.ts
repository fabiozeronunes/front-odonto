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

export interface FaqItem {
  id: string;
  groupId: string;
  question: string;
  answer: string;
}

export interface FaqGroup {
  id: string;
  title: string;
  tag: string;
  featured: boolean;
}

export interface Faq {
  dicaTitle: string;
  dicaText: string;
  dicaCta: string;
  dicaLink: string;
  groups: FaqGroup[];
  items: FaqItem[];
}

export const FAQ_DEFAULT: Faq = {
  dicaTitle: "Dica de ouro",
  dicaText:
    "Assine o PREMIUM para ter todos os recursos de IA e os estudos personalizados para prova e teste — o plano que libera todo o conteúdo do site.",
  dicaCta: "Ver planos",
  dicaLink: "#planos",
  groups: [
    { id: "planos-acesso", title: "Escolha o plano ideal", tag: "Planos de assinatura", featured: true },
    { id: "recursos-ia", title: "Recursos com inteligência", tag: "IA", featured: false },
    { id: "planos-extra", title: "Planos de assinatura", tag: "Planos", featured: false },
    { id: "pagamento", title: "Pagamento", tag: "Pagamento", featured: false },
  ],
  items: [
    {
      id: "i1",
      groupId: "planos-acesso",
      question: "Como funciona o plano gratuito?",
      answer:
        "O plano gratuito dá acesso a vídeos, imagens, áudios e estudos de caso gratuitos, além de busca, tags e área de membros básica. Sem cartão de crédito.",
    },
    {
      id: "i2",
      groupId: "planos-acesso",
      question: "Quais as diferenças entre os planos VIP e PREMIUM?",
      answer:
        "O PREMIUM libera todo o conteúdo do site, com todos os recursos de IA (quizz, flashcards, infográficos, questionários, resumos), download de vídeos e criação de estudos personalizados para provas e testes. O VIP tem acesso total aos conteúdos VIP e a parte dos recursos de IA.",
    },
    {
      id: "i3",
      groupId: "planos-acesso",
      question: "O acesso é liberado na hora?",
      answer:
        "Sim. Assim que o pagamento é confirmado via Pix ou cartão de crédito, o acesso ao plano é liberado imediatamente.",
    },
    {
      id: "i4",
      groupId: "recursos-ia",
      question: "Quais recursos de IA estão incluídos em cada plano?",
      answer:
        "No PREMIUM: resumos em vídeo e áudio, quizz, flashcards, questionários, infográficos e mapas mentais. No VIP: mapas mentais e resumos em áudio.",
    },
    {
      id: "i5",
      groupId: "recursos-ia",
      question: "Como a IA ajuda na revisão?",
      answer:
        "A IA organiza o conteúdo, gera materiais de revisão (flashcards, quizz, resumos e mapas mentais) e acompanha seu desempenho para acelerar o aprendizado.",
    },
    {
      id: "i6",
      groupId: "planos-extra",
      question: "Posso baixar os vídeos para estudar offline?",
      answer:
        "Sim. O download de vídeos está disponível no plano PREMIUM. Também é possível gravar aulas em áudio e vídeo para revisar quando quiser.",
    },
    {
      id: "i7",
      groupId: "planos-extra",
      question: "O que é o Shop Odontus?",
      answer:
        "É a loja de produtos odontológicos da plataforma. Assinantes VIP e PREMIUM têm descontos exclusivos em produtos odontológicos selecionados.",
    },
    {
      id: "i8",
      groupId: "pagamento",
      question: "O pagamento é anual?",
      answer: "Sim, o pagamento é anual, expira anualmente e precisa ser renovado.",
    },
  ],
};

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function normalizeFaq(input: unknown): Faq {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const source = FAQ_DEFAULT;
  const rawGroups = Array.isArray(raw.groups) ? raw.groups : source.groups;
  const rawItems = Array.isArray(raw.items) ? raw.items : source.items;

  const groups: FaqGroup[] = rawGroups
    .map((g) => (g && typeof g === "object" ? (g as Record<string, unknown>) : {}))
    .map((g) => ({
      id: str(g.id, crypto.randomUUID()),
      title: str(g.title, "Grupo"),
      tag: str(g.tag, ""),
      featured: g.featured === true || g.featured === "true",
    }));

  const items: FaqItem[] = rawItems
    .map((it) => (it && typeof it === "object" ? (it as Record<string, unknown>) : {}))
    .map((it) => ({
      id: str(it.id, crypto.randomUUID()),
      groupId: str(it.groupId, groups[0]?.id ?? ""),
      question: str(it.question, "Pergunta"),
      answer: str(it.answer, ""),
    }));

  return {
    dicaTitle: str(raw.dicaTitle, source.dicaTitle),
    dicaText: str(raw.dicaText, source.dicaText),
    dicaCta: str(raw.dicaCta, source.dicaCta),
    dicaLink: str(raw.dicaLink, source.dicaLink),
    groups,
    items,
  };
}

export async function getFaq(): Promise<Faq> {
  const value = await getSiteSetting("faq");
  if (!value) return normalizeFaq(FAQ_DEFAULT);
  try {
    const raw = typeof value === "string" ? JSON.parse(value) : value;
    return normalizeFaq({ ...FAQ_DEFAULT, ...(raw as Record<string, unknown>) });
  } catch {
    return normalizeFaq(FAQ_DEFAULT);
  }
}

export async function saveFaq(input: unknown): Promise<Faq> {
  const next = normalizeFaq(input);
  await upsertSiteSetting("faq", JSON.stringify(next));
  return next;
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
