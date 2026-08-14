import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { beforeAll, afterAll } from "vitest";

process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://odonto:odonto_dev_password@localhost:5432/odonto_study_test";

execSync("npx prisma db push --skip-generate --accept-data-loss", {
  stdio: "inherit",
  env: { ...process.env },
});

const prisma = new PrismaClient();

async function seedTestData() {
  const freePlan = await prisma.membershipPlan.upsert({
    where: { slug: "gratuito" },
    update: {},
    create: { name: "Gratuito", slug: "gratuito", price: 0 },
  });
  const premiumPlan = await prisma.membershipPlan.upsert({
    where: { slug: "premium" },
    update: {},
    create: { name: "Premium", slug: "premium", price: 49.9 },
  });
  const specialty = await prisma.specialty.upsert({
    where: { slug: "endodontia" },
    update: {},
    create: { name: "Endodontia", slug: "endodontia" },
  });

  await prisma.user.upsert({
    where: { email: "test-admin@odonto.study" },
    update: {},
    create: {
      name: "Admin Teste",
      email: "test-admin@odonto.study",
      passwordHash:
        "$2a$10$8ZkY9rY9rY9rY9rY9rY9rO0K9WJtZ8X5V3m0kQ9oE9hYQ5xq5M9S6", // senha inválida, preenchida abaixo
      role: "ADMIN",
      planId: freePlan.id,
    },
  });

  const freeUser = await prisma.user.upsert({
    where: { email: "test-free@odonto.study" },
    update: {},
    create: {
      name: "Free Teste",
      email: "test-free@odonto.study",
      passwordHash: await hash("Senha@123"),
      role: "USER",
      planId: freePlan.id,
    },
  });

  const paidUser = await prisma.user.upsert({
    where: { email: "test-paid@odonto.study" },
    update: {},
    create: {
      name: "Paid Teste",
      email: "test-paid@odonto.study",
      passwordHash: await hash("Senha@123"),
      role: "USER",
      planId: premiumPlan.id,
    },
  });

  await prisma.video.upsert({
    where: { slug: "video-teste-endodontia" },
    update: {},
    create: {
      title: "Vídeo teste Endodontia",
      slug: "video-teste-endodontia",
      videoUrl: "https://www.youtube.com/embed/TEST",
      isFree: true,
      status: "PUBLISHED",
      publishedAt: new Date(),
      specialtyId: specialty.id,
      createdById: freeUser.id,
    },
  });

  await prisma.video.upsert({
    where: { slug: "video-teste-premium" },
    update: {},
    create: {
      title: "Vídeo teste Premium",
      slug: "video-teste-premium",
      videoUrl: "https://www.youtube.com/embed/TEST2",
      isFree: false,
      status: "PUBLISHED",
      publishedAt: new Date(),
      specialtyId: specialty.id,
    },
  });

  await prisma.user.updateMany({
    where: { email: "test-admin@odonto.study" },
    data: { passwordHash: await hash("Admin@123") },
  });
}

import bcrypt from "bcryptjs";
async function hash(pw: string) {
  return bcrypt.hash(pw, 4);
}

beforeAll(async () => {
  await seedTestData();
});

afterAll(async () => {
  await prisma.$disconnect();
});
