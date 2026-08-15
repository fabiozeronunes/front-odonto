import { prisma } from "../../lib/prisma.js";
import { NotFoundError, ConflictError } from "../../utils/errors.js";
import { getPagination, paginated } from "../../utils/pagination.js";
import type { Request } from "express";

function generateAffiliateCode(name: string, id: string) {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 8);
  const suffix = id.replace("cmsrmk", "").slice(0, 5);
  return `${base}${suffix}`;
}

export async function listAffiliates(query: Request["query"]) {
  const { page, perPage, skip } = getPagination(query);

  const where: Record<string, unknown> = { isAffiliate: true };
  if (query.search) {
    where.OR = [
      { name: { contains: String(query.search), mode: "insensitive" as const } },
      { email: { contains: String(query.search), mode: "insensitive" as const } },
      { affiliateCode: { contains: String(query.search), mode: "insensitive" as const } },
    ];
  }

  const [affiliates, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: perPage,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        affiliateCode: true,
        commissionRate: true,
        productCommissionRate: true,
        createdAt: true,
        referrals: { select: { id: true, name: true, email: true, createdAt: true } },
        affiliateCommissions: { select: { id: true, amount: true, status: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const items = affiliates.map((a) => {
    const paid = a.affiliateCommissions
      .filter((c) => c.status === "PAID")
      .reduce((acc, c) => acc + Number(c.amount), 0);
    const pending = a.affiliateCommissions
      .filter((c) => c.status === "PENDING")
      .reduce((acc, c) => acc + Number(c.amount), 0);
    return {
      id: a.id,
      name: a.name,
      email: a.email,
      phone: a.phone,
      affiliateCode: a.affiliateCode,
      commissionRate: Number(a.commissionRate),
      productCommissionRate: Number(a.productCommissionRate),
      createdAt: a.createdAt,
      referredCount: a.referrals.length,
      paidCommissions: paid,
      pendingCommissions: pending,
    };
  });

  return paginated(items, total, { page, perPage, skip });
}

export async function enableAffiliate(userId: string, commissionRate: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("Usuário não encontrado");

  const rate = commissionRate >= 0 && commissionRate <= 100 ? commissionRate : 20;

  if (user.isAffiliate && user.affiliateCode) {
    return prisma.user.update({
      where: { id: userId },
      data: { commissionRate: rate },
      select: { id: true, name: true, email: true, isAffiliate: true, affiliateCode: true, commissionRate: true },
    });
  }

  let code = generateAffiliateCode(user.name, user.id);
  try {
    return await prisma.user.update({
      where: { id: userId },
      data: { isAffiliate: true, affiliateCode: code, commissionRate: rate },
      select: { id: true, name: true, email: true, isAffiliate: true, affiliateCode: true, commissionRate: true },
    });
  } catch {
    code = `${code}${Math.random().toString(36).slice(2, 6)}`;
    return prisma.user.update({
      where: { id: userId },
      data: { isAffiliate: true, affiliateCode: code, commissionRate: rate },
      select: { id: true, name: true, email: true, isAffiliate: true, affiliateCode: true, commissionRate: true },
    });
  }
}

export async function disableAffiliate(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("Usuário não encontrado");
  return prisma.user.update({
    where: { id: userId },
    data: { isAffiliate: false, affiliateCode: null },
    select: { id: true, name: true, email: true, isAffiliate: true, affiliateCode: true, commissionRate: true },
  });
}

export async function setAffiliateCommissionRate(
  userId: string,
  commissionRate: number,
  productCommissionRate?: number
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("Usuário não encontrado");
  const rate = commissionRate >= 0 && commissionRate <= 100 ? commissionRate : 20;
  const data: { commissionRate: number; productCommissionRate?: number } = { commissionRate: rate };
  if (productCommissionRate != null) {
    data.productCommissionRate =
      productCommissionRate >= 0 && productCommissionRate <= 100 ? productCommissionRate : 20;
  }
  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      isAffiliate: true,
      affiliateCode: true,
      commissionRate: true,
      productCommissionRate: true,
    },
  });
}

export async function getAffiliateDetail(affiliateId: string) {
  const affiliate = await prisma.user.findUnique({
    where: { id: affiliateId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      affiliateCode: true,
      commissionRate: true,
      productCommissionRate: true,
      createdAt: true,
      referrals: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          plan: { select: { id: true, name: true, slug: true } },
        },
      },
      affiliateCommissions: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          amount: true,
          percent: true,
          source: true,
          planName: true,
          productName: true,
          status: true,
          createdAt: true,
          paidAt: true,
          referred: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
  if (!affiliate) throw new NotFoundError("Afiliado não encontrado");

  const paid = affiliate.affiliateCommissions
    .filter((c) => c.status === "PAID")
    .reduce((acc, c) => acc + Number(c.amount), 0);
  const pending = affiliate.affiliateCommissions
    .filter((c) => c.status === "PENDING")
    .reduce((acc, c) => acc + Number(c.amount), 0);

  return {
    id: affiliate.id,
    name: affiliate.name,
    email: affiliate.email,
    phone: affiliate.phone,
    affiliateCode: affiliate.affiliateCode,
    commissionRate: Number(affiliate.commissionRate),
    productCommissionRate: Number(affiliate.productCommissionRate),
    createdAt: affiliate.createdAt,
    referrals: affiliate.referrals,
    commissions: affiliate.affiliateCommissions.map((c) => ({
      id: c.id,
      amount: Number(c.amount),
      percent: Number(c.percent),
      source: c.source,
      planName: c.planName,
      productName: c.productName,
      status: c.status,
      createdAt: c.createdAt,
      paidAt: c.paidAt,
      referred: c.referred,
    })),
    totals: { paid, pending },
  };
}

export async function registerReferredPayment(affiliateId: string, referredUserId: string, amount: number) {
  const affiliate = await prisma.user.findUnique({
    where: { id: affiliateId },
    select: { id: true, isAffiliate: true, affiliateCode: true, commissionRate: true },
  });
  if (!affiliate) throw new NotFoundError("Afiliado não encontrado");
  if (!affiliate.isAffiliate) throw new ConflictError("Usuário não é um afiliado");

  const referred = await prisma.user.findUnique({
    where: { id: referredUserId },
    select: { id: true, name: true, email: true },
  });
  if (!referred) throw new NotFoundError("Aluno indicado não encontrado");

  const commission = Math.round(Number(amount) * Number(affiliate.commissionRate)) / 100;

  const existing = await prisma.affiliateCommission.findFirst({
    where: { affiliateId, referredUserId, status: "PENDING" },
  });
  if (existing) {
    throw new ConflictError("Este aluno já possui uma comissão pendente para este afiliado");
  }

  return prisma.affiliateCommission.create({
    data: {
      affiliateId,
      referredUserId,
      amount: commission,
      percent: Number(affiliate.commissionRate),
      source: "MANUAL",
    },
    select: {
      id: true,
      amount: true,
      percent: true,
      status: true,
      createdAt: true,
    },
  });
}

export async function payCommission(commissionId: string) {
  const commission = await prisma.affiliateCommission.findUnique({
    where: { id: commissionId },
  });
  if (!commission) throw new NotFoundError("Comissão não encontrada");

  return prisma.affiliateCommission.update({
    where: { id: commissionId },
    data: { status: "PAID", paidAt: new Date() },
  });
}

export async function cancelCommission(commissionId: string) {
  const commission = await prisma.affiliateCommission.findUnique({
    where: { id: commissionId },
  });
  if (!commission) throw new NotFoundError("Comissão não encontrada");

  return prisma.affiliateCommission.update({
    where: { id: commissionId },
    data: { status: "CANCELED", paidAt: null },
  });
}

export async function getAffiliateSummary(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      isAffiliate: true,
      affiliateCode: true,
      commissionRate: true,
      productCommissionRate: true,
    },
  });
  if (!user) throw new NotFoundError("Usuário não encontrado");
  if (!user.isAffiliate) throw new ConflictError("Usuário não é um afiliado");

  const commissions = await prisma.affiliateCommission.findMany({
    where: { affiliateId: userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      amount: true,
      percent: true,
      source: true,
      planName: true,
      productName: true,
      status: true,
      createdAt: true,
      paidAt: true,
      referred: { select: { id: true, name: true, email: true } },
    },
  });

  const plans = commissions.filter((c) => c.source === "PLAN");
  const products = commissions.filter((c) => c.source === "PRODUCT");
  const paid = commissions
    .filter((c) => c.status === "PAID")
    .reduce((acc, c) => acc + Number(c.amount), 0);
  const pending = commissions
    .filter((c) => c.status === "PENDING")
    .reduce((acc, c) => acc + Number(c.amount), 0);

  return {
    id: user.id,
    name: user.name,
    affiliateCode: user.affiliateCode,
    commissionRate: Number(user.commissionRate),
    productCommissionRate: Number(user.productCommissionRate),
    totals: {
      plansPending: plans
        .filter((c) => c.status === "PENDING")
        .reduce((acc, c) => acc + Number(c.amount), 0),
      productsPending: products
        .filter((c) => c.status === "PENDING")
        .reduce((acc, c) => acc + Number(c.amount), 0),
      paid,
      pending,
    },
    plans: plans.map((c) => ({
      id: c.id,
      amount: Number(c.amount),
      percent: Number(c.percent),
      planName: c.planName,
      status: c.status,
      createdAt: c.createdAt,
      paidAt: c.paidAt,
      referred: c.referred,
    })),
    products: products.map((c) => ({
      id: c.id,
      amount: Number(c.amount),
      percent: Number(c.percent),
      productName: c.productName,
      status: c.status,
      createdAt: c.createdAt,
      paidAt: c.paidAt,
      referred: c.referred,
    })),
  };
}