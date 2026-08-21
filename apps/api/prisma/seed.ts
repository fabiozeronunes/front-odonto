import { PrismaClient, Role, ContentStatus, Difficulty, VideoType, BillingPeriod } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const prisma = new PrismaClient();

function randomPassword(): string {
  return crypto.randomBytes(12).toString("base64url");
}

const specialties = [
  { name: "Dentística", description: "Restaurações e estética do dente" },
  { name: "Endodontia", description: "Tratamento de canal e polpa" },
  { name: "Periodontia", description: "Tecidos de suporte e gengiva" },
  { name: "Ortodontia", description: "Aparelhos e alinhamento" },
  { name: "Implantodontia", description: "Implantes dentários" },
  { name: "Cirurgia Bucomaxilofacial", description: "Cirurgias da face e boca" },
  { name: "Odontopediatria", description: "Odontologia infantil" },
  { name: "Prótese Dentária", description: "Próteses e reabilitação" },
  { name: "Radiologia Odontológica", description: "Exames e imagens" },
  { name: "Estomatologia", description: "Diagnóstico de doenças bucais" },
  { name: "Odontologia Restauradora", description: "Reabilitação estética-funcional" },
  { name: "Harmonização Orofacial", description: "Estética facial" },
  { name: "Saúde Coletiva", description: "Saúde pública e odontologia social" },
  { name: "DTM", description: "Disfunção temporomandibular" },
  { name: "Patologia Oral", description: "Estudo de lesões bucais" },
];

const tags = [
  "canal radicular",
  "restauração",
  "implante",
  "cirurgia",
  "diagnóstico",
  "anestesia",
  "radiografia",
  "materiais odontológicos",
  "técnica clínica",
  "emergência",
];

const videos = [
  {
    title: "Abertura coronária em Endodontia",
    description: "Técnica passo a passo de abertura coronária para acesso aos canais radiculares.",
    videoUrl: "https://www.youtube.com/embed/VIDEO_1",
    videoType: VideoType.EMBED,
    difficulty: Difficulty.BASICO,
    isFree: true,
    author: "Dr. Carlos Mendes",
    institution: "Universidade Federal de Odontologia",
    specialty: "Endodontia",
    tags: ["canal radicular", "técnica clínica", "anestesia"],
  },
  {
    title: "Restauração Classe II em resina composta",
    description: "Restauração estética de cavidade classe II com técnica incremental.",
    videoUrl: "https://www.youtube.com/embed/VIDEO_2",
    videoType: VideoType.EMBED,
    difficulty: Difficulty.INTERMEDIARIO,
    isFree: true,
    author: "Dra. Fernanda Alves",
    institution: "Clínica OdontoSul",
    specialty: "Dentística",
    tags: ["restauração", "materiais odontológicos"],
  },
  {
    title: "Instalação de implante unitário",
    description: "Planejamento e cirurgia de instalação de implante unitário passo a passo.",
    videoUrl: "https://www.youtube.com/embed/VIDEO_3",
    videoType: VideoType.EMBED,
    difficulty: Difficulty.AVANCADO,
    isFree: false,
    author: "Dr. Ricardo Tavares",
    institution: "Instituto de Implantodontia",
    specialty: "Implantodontia",
    tags: ["implante", "cirurgia", "técnica clínica"],
  },
  {
    title: "Radiografia panorâmica: interpretação básica",
    description: "Como interpretar radiografias panorâmicas e identificar achados comuns.",
    videoUrl: "https://www.youtube.com/embed/VIDEO_4",
    videoType: VideoType.EMBED,
    difficulty: Difficulty.BASICO,
    isFree: true,
    author: "Dra. Patrícia Lima",
    institution: "Faculdade de Radiologia Odontológica",
    specialty: "Radiologia Odontológica",
    tags: ["radiografia", "diagnóstico"],
  },
  {
    title: "Manobra de anestesia do nervo alveolar inferior",
    description: "Técnica de anestesia para bloqueio do nervo alveolar inferior.",
    videoUrl: "https://www.youtube.com/embed/VIDEO_5",
    videoType: VideoType.EMBED,
    difficulty: Difficulty.BASICO,
    isFree: true,
    author: "Dr. Eduardo Costa",
    institution: "Universidade Estadual de Odontologia",
    specialty: "Cirurgia Bucomaxilofacial",
    tags: ["anestesia", "cirurgia"],
  },
  {
    title: "Tratamento de fratura radicular com terapia regenerativa",
    description: "Estudo de caso avançado de fratura radicular vertical e opções de tratamento.",
    videoUrl: "https://www.youtube.com/embed/VIDEO_6",
    videoType: VideoType.EMBED,
    difficulty: Difficulty.AVANCADO,
    isFree: false,
    author: "Dr. Carlos Mendes",
    institution: "Universidade Federal de Odontologia",
    specialty: "Endodontia",
    tags: ["canal radicular", "emergência", "diagnóstico"],
  },
];

const caseStudies = [
  {
    title: "Caso clínico: reabilitação com implante imediato",
    description: "Reabilitação de dente anterior com implante imediato após exodontia.",
    diagnosis: "Fratura radicular vertical no elemento 21",
    difficulty: Difficulty.AVANCADO,
    isFree: false,
    author: "Dr. Ricardo Tavares",
    institution: "Instituto de Implantodontia",
    specialty: "Implantodontia",
    tags: ["implante", "cirurgia"],
  },
  {
    title: "Caso clínico: canal com calcificação parcial",
    description: "Tratamento endodôntico de dente com calcificação parcial do canal.",
    diagnosis: "Calcificação parcial do canal radicular",
    difficulty: Difficulty.INTERMEDIARIO,
    isFree: true,
    author: "Dr. Carlos Mendes",
    institution: "Universidade Federal de Odontologia",
    specialty: "Endodontia",
    tags: ["canal radicular", "diagnóstico"],
  },
];

async function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  console.log("Iniciando seed...");

  const freePlan = await prisma.membershipPlan.upsert({
    where: { slug: "gratuito" },
    update: {},
    create: {
      name: "Gratuito",
      slug: "gratuito",
      description: "Acesso a conteúdos gratuitos, busca e tags.",
      price: 0,
      billing: BillingPeriod.MONTHLY,
      benefits: ["Acesso a vídeos gratuitos", "Busca e filtros", "Área de membros básica"],
      sortOrder: 1,
    },
  });

  const premiumPlan = await prisma.membershipPlan.upsert({
    where: { slug: "premium" },
    update: {},
    create: {
      name: "Premium",
      slug: "premium",
      description: "Acesso total a conteúdos premium, estudos de caso e benefícios do Shopping.",
      price: 49.9,
      billing: BillingPeriod.MONTHLY,
      benefits: ["Todos os vídeos", "Estudos de caso exclusivos", "Acesso diferenciado ao Shopping"],
      sortOrder: 2,
    },
  });

  const adminPassword = process.env.ADMIN_PASSWORD ?? randomPassword();
  const userPassword = process.env.USER_PASSWORD ?? randomPassword();
  const adminHash = await bcrypt.hash(adminPassword, 10);
  const userHash = await bcrypt.hash(userPassword, 10);

  console.log("\n========================================");
  console.log("SEED COMPLETO — Credenciais geradas:");
  console.log(`  Admin: admin@odonto.study / ${adminPassword}`);
  console.log(`  User:  aluno@odonto.study / ${userPassword}`);
  console.log("========================================\n");

  await prisma.user.upsert({
    where: { email: "admin@odonto.study" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@odonto.study",
      passwordHash: adminHash,
      role: Role.ADMIN,
      planId: premiumPlan.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "aluno@odonto.study" },
    update: {},
    create: {
      name: "Aluno Premium",
      email: "aluno@odonto.study",
      passwordHash: userHash,
      role: Role.USER,
      planId: premiumPlan.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "gratuito@odonto.study" },
    update: {},
    create: {
      name: "Aluno Gratuito",
      email: "gratuito@odonto.study",
      passwordHash: userPassword,
      role: Role.USER,
      planId: freePlan.id,
    },
  });

  const specialtyMap: Record<string, string> = {};
  for (const spec of specialties) {
    const created = await prisma.specialty.upsert({
      where: { slug: await slugify(spec.name) },
      update: { description: spec.description },
      create: { name: spec.name, slug: await slugify(spec.name), description: spec.description },
    });
    specialtyMap[spec.name] = created.id;
  }

  const tagMap: Record<string, string> = {};
  for (const tag of tags) {
    const created = await prisma.tag.upsert({
      where: { slug: await slugify(tag) },
      update: {},
      create: { name: tag, slug: await slugify(tag) },
    });
    tagMap[tag] = created.id;
  }

  for (const video of videos) {
    const slug = await slugify(video.title);
    const existing = await prisma.video.findUnique({ where: { slug } });
    if (existing) continue;

    const specialtyId = specialtyMap[video.specialty];
    const tagIds = video.tags.map((t) => tagMap[t]).filter(Boolean);

    await prisma.video.create({
      data: {
        title: video.title,
        slug,
        description: video.description,
        videoUrl: video.videoUrl,
        videoType: video.videoType,
        difficulty: video.difficulty,
        isFree: video.isFree,
        author: video.author,
        institution: video.institution,
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
        specialtyId,
        tags: {
          create: tagIds.map((tagId) => ({ tagId })),
        },
      },
    });
  }

  for (const cs of caseStudies) {
    const slug = await slugify(cs.title);
    const existing = await prisma.caseStudy.findUnique({ where: { slug } });
    if (existing) continue;

    const specialtyId = specialtyMap[cs.specialty];
    const tagIds = cs.tags.map((t) => tagMap[t]).filter(Boolean);

    await prisma.caseStudy.create({
      data: {
        title: cs.title,
        slug,
        description: cs.description,
        diagnosis: cs.diagnosis,
        difficulty: cs.difficulty,
        isFree: cs.isFree,
        author: cs.author,
        institution: cs.institution,
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
        specialtyId,
        tags: {
          create: tagIds.map((tagId) => ({ tagId })),
        },
      },
    });
  }

  console.log("Seed concluído.");
  console.log("Usuários:");
  console.log("  admin@odonto.study / Admin@123 (ADMIN)");
  console.log("  aluno@odonto.study / Usuario@123 (PREMIUM)");
  console.log("  gratuito@odonto.study / Usuario@123 (FREE)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
