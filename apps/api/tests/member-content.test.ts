import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

const app = createApp();

async function login(email: string, password: string) {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  return res.body.tokens.accessToken as string;
}

describe("Conteúdo por membro", () => {
  it("membro com plano pago cria vídeo com observações e imagens e lista em /me", async () => {
    const token = await login("test-paid@odonto.study", "Senha@123");
    const created = await request(app)
      .post("/api/videos")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: `Vídeo do membro ${Date.now()}`,
        videoUrl: "https://www.youtube.com/embed/MEMBRO-ONE",
        status: "PUBLISHED",
        observations: "nota interna",
        imageUrls: ["https://example.com/a.jpg"],
      });
    expect(created.status).toBe(201);
    const id = created.body.data.id;

    const mine = await request(app)
      .get("/api/videos/me")
      .set("Authorization", `Bearer ${token}`);
    expect(mine.status).toBe(200);
    const found = mine.body.data.find((v: { id: string }) => v.id === id);
    expect(found.observations).toBe("nota interna");
    expect(found.images.length).toBe(1);

    const pub = await request(app).get(`/api/videos/${id}`);
    expect(pub.status).toBe(200);
    expect(pub.body.video.observations).toBeUndefined();
  });

  it("bloqueia excluir caso de outro membro", async () => {
    const token = await login("test-paid@odonto.study", "Senha@123");
    const created = await request(app)
      .post("/api/case-studies")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: `Caso do free ${Date.now()}` });
    expect(created.status).toBe(201);
    const id = created.body.data.id;

    const other = await login("test-admin@odonto.study", "Admin@123");
    const res = await request(app)
      .delete(`/api/case-studies/${id}`)
      .set("Authorization", `Bearer ${other}`);
    expect(res.status).toBe(200);

    const gone = await request(app).get(`/api/case-studies/${id}`);
    expect(gone.status).toBe(404);
  });

  it("bloqueia upload de imagem sem autenticação", async () => {
    const res = await request(app).post("/api/uploads").attach("image", Buffer.from("x"), "x.jpg");
    expect(res.status).toBe(401);
  });

  it("membro com plano pago pode criar tag p/ uso próprio e ela aparece no catálogo", async () => {
    const token = await login("test-paid@odonto.study", "Senha@123");
    const res = await request(app)
      .post("/api/tags")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: `Tag do membro ${Date.now()}` });
    expect(res.status).toBe(201);

    const tagName = res.body.data.name;
    const pub = await request(app).get(`/api/tags?search=${encodeURIComponent(tagName)}`);
    expect(pub.status).toBe(200);
    expect(pub.body.data.some((t: { id: string }) => t.id === res.body.data.id)).toBe(true);
  });

  it("bloqueia usuário gratuito de criar conteúdo", async () => {
    const token = await login("test-free@odonto.study", "Senha@123");
    const video = await request(app)
      .post("/api/videos")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: `Vídeo do free ${Date.now()}` });
    expect(video.status).toBe(403);

    const caseStudy = await request(app)
      .post("/api/case-studies")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: `Caso do free ${Date.now()}` });
    expect(caseStudy.status).toBe(403);

    const tag = await request(app)
      .post("/api/tags")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: `Tag do free ${Date.now()}` });
    expect(tag.status).toBe(403);

    const specialty = await request(app)
      .post("/api/specialties")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: `Especialidade do free ${Date.now()}` });
    expect(specialty.status).toBe(403);
  });
});

describe("Checkout de planos", () => {
  it("cria checkout e confirma, ativando o plano pago", async () => {
    const token = await login("test-paid@odonto.study", "Senha@123");
    const plans = await request(app).get("/api/plans");
    const premium = plans.body.data.find((p: { slug: string }) => p.slug === "premium");

    const checkout = await request(app)
      .post("/api/checkout")
      .set("Authorization", `Bearer ${token}`)
      .send({ planId: premium.id });
    expect(checkout.status).toBe(201);
    expect(checkout.body.data.status).toBe("PENDING");
    expect(checkout.body.data.orderId).toBeDefined();

    // confirmacao de pagamento é admin-only (cliente não confirma o próprio pagamento)
    const adminLogin = await request(app).post("/api/auth/login").send({
      email: "test-admin@odonto.study",
      password: "Admin@123",
    });
    const confirm = await request(app)
      .post(`/api/checkout/${checkout.body.data.orderId}/confirm`)
      .set("Authorization", `Bearer ${adminLogin.body.tokens.accessToken}`);
    expect(confirm.status).toBe(200);
    expect(confirm.body.data.ok).toBe(true);
    expect(confirm.body.data.planId).toBe(premium.id);

    const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(me.body.user.plan.id).toBe(premium.id);
  });

  it("rejeita checkout para o plano gratuito", async () => {
    const token = await login("test-paid@odonto.study", "Senha@123");
    const plans = await request(app).get("/api/plans");
    const free = plans.body.data.find((p: { slug: string }) => p.slug === "gratuito");

    const res = await request(app)
      .post("/api/checkout")
      .set("Authorization", `Bearer ${token}`)
      .send({ planId: free.id });
    expect(res.status).toBe(409);
  });

  it("bloqueia checkout sem autenticação", async () => {
    const plans = await request(app).get("/api/plans");
    const premium = plans.body.data.find((p: { slug: string }) => p.slug === "premium");
    const res = await request(app).post("/api/checkout").send({ planId: premium.id });
    expect(res.status).toBe(401);
  });

  it("cadastro sempre inicia no plano gratuito (upgrade apenas via checkout)", async () => {
    const email = `checkout-free-${Date.now()}@odonto.study`;
    const free = await request(app).post("/api/auth/register").send({
      name: "Checkout Free",
      email,
      password: "Tr0v#2026-xQ!zR",
    });
    expect(free.status).toBe(201);
    expect(free.body.user.planId).toBeDefined();
  });
});