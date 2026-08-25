import { prisma } from "../../lib/prisma.js";
import { NotFoundError } from "../../utils/errors.js";
import { slugify } from "../../utils/slugify.js";
import type { CreatePlanInput, UpdatePlanInput } from "./plans.validators.js";

export async function listPlans() {
  return prisma.membershipPlan.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take: 100,
    include: { _count: { select: { users: true } } },
  });
}

export async function createPlan(input: CreatePlanInput) {
  return prisma.membershipPlan.create({
    data: {
      name: input.name,
      slug: slugify(input.name),
      description: input.description,
      price: input.price,
      billing: input.billing,
      benefits: input.benefits,
      status: input.status,
      sortOrder: input.sortOrder ?? 0,
    },
  });
}

export async function updatePlan(id: string, input: UpdatePlanInput) {
  await prisma.membershipPlan.findUniqueOrThrow({ where: { id } }).catch(() => {
    throw new NotFoundError("Plano não encontrado");
  });
  return prisma.membershipPlan.update({
    where: { id },
    data: {
      ...(input.name ? { name: input.name, slug: slugify(input.name) } : {}),
      description: input.description,
      price: input.price,
      billing: input.billing,
      benefits: input.benefits,
      status: input.status,
      sortOrder: input.sortOrder,
    },
  });
}

export async function deletePlan(id: string) {
  const count = await prisma.user.count({ where: { planId: id } });
  if (count > 0) {
    throw new Error("Não é possível excluir um plano em uso por usuários");
  }
  await prisma.membershipPlan.findUniqueOrThrow({ where: { id } }).catch(() => {
    throw new NotFoundError("Plano não encontrado");
  });
  await prisma.membershipPlan.delete({ where: { id } });
  return { ok: true };
}
