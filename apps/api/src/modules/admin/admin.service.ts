import { prisma } from "../../lib/prisma.js";
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
    ];
  }
  if (query.role) {
    where.role = query.role;
  }

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: perPage,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        plan: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return paginated(items, total, { page, perPage, skip });
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
