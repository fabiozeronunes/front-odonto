import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import { ConflictError, NotFoundError } from "../../utils/errors.js";
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
    prisma.user.count({ where: { plan: { slug: { not: "gratuito" } } } }),
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
      select: { id: true, name: true, email: true, registrationNumber: true, role: true, createdAt: true },
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
    select: userBillingSelect,
  });

  const items = users.map(classifyUser);

  let filtered = items;
  if (query.status === "pagos") filtered = items.filter((u) => u.paymentStatus === "PAGO");
  if (query.status === "atraso") filtered = items.filter((u) => u.paymentStatus === "EM_ATRASO");
  if (query.status === "aguardando")
    filtered = items.filter((u) => u.paymentStatus === "AGUARDANDO_PAGAMENTO");
  if (query.status === "gratuito") filtered = items.filter((u) => u.paymentStatus === "GRATUITO");

  const total = filtered.length;
  const pageStart = (page - 1) * perPage;
  return paginated(filtered.slice(pageStart, pageStart + perPage), total, { page, perPage, skip });
}

interface UserBillingRow {
  id: string;
  name: string;
  email: string;
  registrationNumber: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
  isAffiliate: boolean;
  affiliateCode: string | null;
  createdAt: Date;
  plan: { id: string; name: string; slug: string } | null;
  subscriptions: { id: string; status: string; startsAt: Date | null; endsAt: Date | null }[];
  orders: { id: string; status: string; total: unknown; createdAt: Date }[];
}

const userBillingSelect = {
  id: true,
  name: true,
  email: true,
  registrationNumber: true,
  phone: true,
  role: true,
  isActive: true,
  isAffiliate: true,
  affiliateCode: true,
  createdAt: true,
  plan: { select: { id: true, name: true, slug: true } },
  subscriptions: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: { id: true, status: true, startsAt: true, endsAt: true },
  },
  orders: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: { id: true, status: true, total: true, createdAt: true },
  },
} as const;

function classifyUser(u: UserBillingRow) {
  const sub = u.subscriptions[0];
  const order = u.orders[0];
  const isPremiumPlan = u.plan?.slug != null && u.plan.slug !== "gratuito";
  const now = new Date();

  let paymentStatus: "PAGO" | "EM_ATRASO" | "AGUARDANDO_PAGAMENTO" | "GRATUITO" | null = "GRATUITO";
  let lastPaymentAt: string | null = null;
  let expiresAt: string | null = null;

  if (u.role === "ADMIN") {
    paymentStatus = null;
    lastPaymentAt = null;
    expiresAt = null;
  } else {
    if (sub && sub.status === "PENDING") {
      paymentStatus = "AGUARDANDO_PAGAMENTO";
    }
    if (order && order.status === "PENDING") {
      paymentStatus = "AGUARDANDO_PAGAMENTO";
    }
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
      if (paymentStatus !== "AGUARDANDO_PAGAMENTO") {
        paymentStatus = "EM_ATRASO";
      }
    }
    if (sub && sub.status === "EXPIRED") {
      paymentStatus = "EM_ATRASO";
      expiresAt = sub.endsAt?.toISOString() ?? null;
    }
    if (sub && sub.status === "ACTIVE" && sub.endsAt && sub.endsAt < now) {
      paymentStatus = "EM_ATRASO";
      expiresAt = sub.endsAt.toISOString();
    }
  }

  return {
    id: u.id,
    name: u.name,
    email: u.email,
    registrationNumber: u.registrationNumber,
    phone: u.phone,
    role: u.role,
    isActive: u.isActive,
    isAffiliate: u.isAffiliate,
    affiliateCode: u.affiliateCode,
    createdAt: u.createdAt,
    plan: u.plan,
    paymentStatus,
    lastPaymentAt,
    expiresAt,
    subscriptionStatus: sub?.status ?? null,
  };
}

export async function listStudyResources(query: Request["query"]) {
  const { page, perPage, skip } = getPagination(query);
  const where: Record<string, unknown> = {};
  if (query.status) {
    where.status = query.status;
  }

  const [items, total] = await Promise.all([
    prisma.studyResource.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: perPage,
      select: {
        id: true,
        type: true,
        status: true,
        title: true,
        createdAt: true,
        video: { select: { id: true, title: true, slug: true } },
        author: { select: { id: true, name: true, email: true } },
        _count: { select: { votes: true } },
      },
    }),
    prisma.studyResource.count({ where }),
  ]);

  return paginated(
    items.map((r) => ({ ...r, votes: r._count.votes, _count: undefined })),
    total,
    { page, perPage, skip }
  );
}

export async function setStudyStatus(resourceId: string, status: "PUBLICADO" | "REJEITADO") {
  const resource = await prisma.studyResource.findUnique({ where: { id: resourceId } });
  if (!resource) throw new NotFoundError("Recurso de estudo não encontrado");
  return prisma.studyResource.update({
    where: { id: resourceId },
    data: { status },
    select: { id: true, status: true },
  });
}

export async function getBillingSummary() {
  const plans = await prisma.membershipPlan.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, price: true },
  });
  const users = await prisma.user.findMany({ select: userBillingSelect });

  const byPlan = new Map<string, { count: number; paidCount: number; overdueCount: number }>();
  for (const p of plans) {
    byPlan.set(p.id, { count: 0, paidCount: 0, overdueCount: 0 });
  }

  for (const u of users) {
    const row = classifyUser(u);
    const key = row.plan?.id ?? "";
    const entry = byPlan.get(key);
    if (!entry) continue;
    entry.count += 1;
    if (row.paymentStatus === "PAGO") {
      entry.paidCount += 1;
    }
    if (row.paymentStatus === "EM_ATRASO") entry.overdueCount += 1;
  }

  return {
    plans: plans.map((p) => {
      const entry = byPlan.get(p.id)!;
      const price = Number(p.price);
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price,
        count: entry.count,
        paidCount: entry.paidCount,
        overdueCount: entry.overdueCount,
        paidTotal: price * entry.paidCount,
      };
    }),
  };
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

export async function confirmUserPayment(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
  if (!user) throw new NotFoundError("Usuário não encontrado");

  const subscription = await prisma.subscription.findFirst({
    where: { userId: id, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: { plan: true },
  });
  if (!subscription) {
    throw new ConflictError("Nenhuma assinatura pendente para confirmar");
  }

  const order = await prisma.order.findFirst({
    where: { userId: id, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
  if (!order) {
    throw new ConflictError("Nenhum pedido pendente para confirmar");
  }

  const startsAt = new Date();
  const endsAt = addBillingPeriod(subscription.plan.billing, startsAt);

  await prisma.$transaction([
    prisma.order.update({ where: { id: order.id }, data: { status: "PAID" } }),
    prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "ACTIVE", startsAt, endsAt },
    }),
    prisma.user.update({ where: { id }, data: { planId: subscription.planId } }),
  ]);

  const referred = await prisma.user.findUnique({
    where: { id },
    select: { referredById: true },
  });

  if (referred?.referredById) {
    const affiliate = await prisma.user.findUnique({
      where: { id: referred.referredById },
      select: { id: true, isAffiliate: true, commissionRate: true },
    });
    if (affiliate?.isAffiliate) {
      const existing = await prisma.affiliateCommission.findFirst({
        where: {
          affiliateId: affiliate.id,
          referredUserId: id,
          status: "PENDING",
        },
      });
      if (!existing) {
        const amount = Math.round(Number(order.total) * Number(affiliate.commissionRate)) / 100;
        await prisma.affiliateCommission.create({
          data: {
            affiliateId: affiliate.id,
            referredUserId: id,
            amount,
            percent: Number(affiliate.commissionRate),
            source: "PLAN",
            planName: subscription.plan.name,
          },
        });
      }
    }
  }

  return {
    ok: true,
    userId: id,
    planId: subscription.planId,
    planName: subscription.plan.name,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
  };
}

function addBillingPeriod(billing: "MONTHLY" | "YEARLY", from: Date) {
  const date = new Date(from);
  if (billing === "YEARLY") {
    date.setFullYear(date.getFullYear() + 1);
  } else {
    date.setMonth(date.getMonth() + 1);
  }
  return date;
}

export async function updateUserContact(id: string, data: { phone?: string | null }) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError("Usuário não encontrado");
  return prisma.user.update({
    where: { id },
    data: { phone: data.phone ?? null },
  });
}

export async function deleteUser(id: string, requestingUserId: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError("Usuário não encontrado");
  if (id === requestingUserId) {
    throw new ConflictError("Você não pode excluir a própria conta.");
  }
  if (user.role === "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      throw new ConflictError("Não é possível excluir o último administrador.");
    }
  }
  await prisma.user.delete({ where: { id } });
  return { id, name: user.name, deleted: true };
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
