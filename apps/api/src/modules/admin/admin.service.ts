import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import { NotFoundError } from "../../utils/errors.js";
import { getPagination, paginated } from "../../utils/pagination.js";
import type { Request } from "express";

export async function getDashboard() {
  const [
    totalUsers,
    freeUsers,
    premiumUsers,
    activeSubscriptions,
    totalVideos,
    publishedVideos,
    totalSpecialties,
    totalCaseStudies,
    totalTags,
    totalProducts,
    totalOrders,
    topVideos,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { plan: { slug: "gratuito" } } }),
    prisma.user.count({ where: { plan: { slug: "premium" } } }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.video.count(),
    prisma.video.count({ where: { status: "PUBLISHED" } }),
    prisma.specialty.count(),
    prisma.caseStudy.count(),
    prisma.tag.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.video.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { viewCount: "desc" },
      take: 5,
      select: { id: true, title: true, slug: true, viewCount: true, isFree: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
  ]);

  return {
    users: { total: totalUsers, free: freeUsers, premium: premiumUsers },
    subscriptions: { active: activeSubscriptions },
    content: {
      videos: totalVideos,
      publishedVideos,
      specialties: totalSpecialties,
      caseStudies: totalCaseStudies,
      tags: totalTags,
    },
    shopping: { products: totalProducts, orders: totalOrders },
    topVideos,
    recentUsers,
  };
}

export async function listUsers(query: Request["query"]) {
  const { page, perPage, skip } = getPagination(query);
  const where: Record<string, unknown> = {};

  if (query.search) {
    where.OR = [
      { name: { contains: String(query.search), mode: "insensitive" as const } },
      { email: { contains: String(query.search), mode: "insensitive" as const } },
      { phone: { contains: String(query.search), mode: "insensitive" as const } },
    ];
  }
  if (query.role) {
    where.role = query.role;
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip,
    take: perPage,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
      plan: { select: { id: true, name: true, slug: true } },
      subscriptions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, status: true, startsAt: true, endsAt: true },
      },
      orders: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, status: true, total: true, createdAt: true },
      },
    },
  });

  const items = users.map((u) => {
    const sub = u.subscriptions[0];
    const order = u.orders[0];
    const isPremiumPlan = u.plan?.slug === "premium";
    const now = new Date();

    let paymentStatus: "PAGO" | "EM_ATRASO" | "GRATUITO" = "GRATUITO";
    let lastPaymentAt: string | null = null;
    let expiresAt: string | null = null;

    if (order && order.status === "PAID") {
      paymentStatus = "PAGO";
      lastPaymentAt = order.createdAt.toISOString();
    }
    if (sub && sub.status === "ACTIVE") {
      paymentStatus = "PAGO";
      lastPaymentAt = lastPaymentAt ?? sub.startsAt?.toISOString() ?? null;
      expiresAt = sub.endsAt?.toISOString() ?? null;
    }
    if (isPremiumPlan && !(order && order.status === "PAID") && !(sub && sub.status === "ACTIVE")) {
      paymentStatus = "EM_ATRASO";
    }
    if (sub && sub.status === "EXPIRED") {
      paymentStatus = "EM_ATRASO";
      expiresAt = sub.endsAt?.toISOString() ?? null;
    }
    if (sub && sub.status === "ACTIVE" && sub.endsAt && sub.endsAt < now) {
      paymentStatus = "EM_ATRASO";
      expiresAt = sub.endsAt.toISOString();
    }

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
      plan: u.plan,
      paymentStatus,
      lastPaymentAt,
      expiresAt,
      subscriptionStatus: sub?.status ?? null,
    };
  });

  let filtered = items;
  if (query.status === "pagos") filtered = items.filter((u) => u.paymentStatus === "PAGO");
  if (query.status === "atraso") filtered = items.filter((u) => u.paymentStatus === "EM_ATRASO");
  if (query.status === "gratuito") filtered = items.filter((u) => u.paymentStatus === "GRATUITO");

  const total = filtered.length;
  const pageStart = (page - 1) * perPage;
  return paginated(filtered.slice(pageStart, pageStart + perPage), total, { page, perPage, skip });
}

export async function setUserActive(id: string, isActive: boolean) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError("Usuário não encontrado");
  return prisma.user.update({ where: { id }, data: { isActive } });
}

export async function setUserRole(id: string, role: "ADMIN" | "USER") {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError("Usuário não encontrado");
  return prisma.user.update({ where: { id }, data: { role } });
}

export async function setUserPlan(id: string, planId: string) {
  const plan = await prisma.membershipPlan.findUnique({ where: { id: planId } });
  if (!plan) throw new NotFoundError("Plano não encontrado");
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError("Usuário não encontrado");
  return prisma.user.update({ where: { id }, data: { planId } });
}

export async function updateUserContact(id: string, data: { phone?: string | null }) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError("Usuário não encontrado");
  return prisma.user.update({
    where: { id },
    data: { phone: data.phone ?? null },
  });
}

function buildWhatsAppMessage(user: { name: string; planName?: string }) {
  return `Olá, ${user.name}! 👋\n\nDetectamos que sua assinatura do plano ${user.planName ?? "Premium"} da *FrontOdontus* está em atraso. Para não perder o acesso aos conteúdos, regularize o pagamento o quanto antes.\n\nQualquer dúvida, estamos à disposição! 😊`;
}

export async function notifyUserWhatsApp(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, phone: true, plan: { select: { name: true } } },
  });
  if (!user) throw new NotFoundError("Usuário não encontrado");

  const message = buildWhatsAppMessage(user);
  const phone = user.phone ? user.phone.replace(/\D/g, "") : "";

  const fallbackLink = phone
    ? `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`
    : null;

  if (env.whatsappApiUrl) {
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (env.whatsappApiToken) headers.Authorization = `Bearer ${env.whatsappApiToken}`;
      const res = await fetch(env.whatsappApiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({ phone: phone ? `55${phone}` : "", message }),
      });
      if (!res.ok) throw new Error(`WhatsApp API respondeu ${res.status}`);
      return { sent: true, message };
    } catch (e) {
      return {
        sent: false,
        message,
        fallbackLink,
        error: e instanceof Error ? e.message : "Erro ao enviar via API",
      };
    }
  }

  if (!fallbackLink) {
    throw new Error(
      "Usuário sem telefone cadastrado e sem WhatsApp API configurada. Adicione o telefone ou configure WHATSAPP_API_URL."
    );
  }

  return { sent: false, fallbackLink, message };
}
