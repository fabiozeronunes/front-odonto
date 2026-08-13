import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

const app = createApp();

async function login(email: string, password: string) {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  return res.body.tokens.accessToken as string;
}

describe("Vídeos", () => {
  it("lista apenas vídeos publicados publicamente", async () => {
    const res = await request(app).get("/api/videos");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    for (const video of res.body.data) {
      expect(video.status).toBe("PUBLISHED");
    }
    expect(res.body.pagination).toBeDefined();
  });

  it("busca por termo", async () => {
    const res = await request(app).get("/api/videos").query({ search: "endodontia" });
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("filtra por especialidade", async () => {
    const spec = await request(app).get("/api/specialties");
    const endodontia = spec.body.data.find((s: { slug: string }) => s.slug === "endodontia");
    const res = await request(app).get("/api/videos").query({ specialty: endodontia.id });
    expect(res.status).toBe(200);
    for (const video of res.body.data) {
      expect(video.specialty.slug).toBe("endodontia");
    }
  });

  it("detalha vídeo e retorna relacionados", async () => {
    const res = await request(app).get("/api/videos/video-teste-endodontia");
    expect(res.status).toBe(200);
    expect(res.body.video.title).toBe("Vídeo teste Endodontia");
    expect(Array.isArray(res.body.related)).toBe(true);
  });

  it("retorna 404 para vídeo inexistente", async () => {
    const res = await request(app).get("/api/videos/video-nao-existe");
    expect(res.status).toBe(404);
  });

  it("permite que ADMIN crie vídeo", async () => {
    const token = await login("test-admin@odonto.study", "Admin@123");
    const res = await request(app)
      .post("/api/videos")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: `Vídeo novo ${Date.now()}`,
        videoUrl: "https://www.youtube.com/embed/NOVO",
        isFree: true,
        status: "PUBLISHED",
      });
    expect(res.status).toBe(201);
    expect(res.body.data.slug).toBeDefined();
  });

  it("permite que membro com plano pago crie vídeo e ele apareça em 'meus vídeos'", async () => {
    const token = await login("test-paid@odonto.study", "Senha@123");
    const res = await request(app)
      .post("/api/videos")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: `Vídeo do membro ${Date.now()}`,
        videoUrl: "https://www.youtube.com/embed/MEMBRO1",
        isFree: true,
        status: "DRAFT",
      });
    expect(res.status).toBe(201);
    expect(res.body.data.createdById).toBeDefined();

    const mine = await request(app)
      .get("/api/videos/me")
      .set("Authorization", `Bearer ${token}`);
    expect(mine.status).toBe(200);
    expect(mine.body.data.some((v: { id?: string }) => v.id === res.body.data.id)).toBe(true);
  });

  it("bloqueia excluir vídeo de outro usuário", async () => {
    const adminToken = await login("test-admin@odonto.study", "Admin@123");
    const created = await request(app)
      .post("/api/videos")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: `Vídeo admin ${Date.now()}`, videoUrl: "https://youtu.be/ADMIN-VID" });
    expect(created.status).toBe(201);

    const token = await login("test-paid@odonto.study", "Senha@123");
    const res = await request(app)
      .delete(`/api/videos/${created.body.data.id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("bloqueia criação de vídeo sem autenticação", async () => {
    const res = await request(app).post("/api/videos").send({ title: "X" });
    expect(res.status).toBe(401);
  });

  it("permite favoritar e listar favoritos", async () => {
    const token = await login("test-free@odonto.study", "Senha@123");
    let res = await request(app)
      .post("/api/videos/video-teste-endodontia/favorite")
      .set("Authorization", `Bearer ${token}`);
    if (!res.body.favorited) {
      await request(app)
        .post("/api/videos/video-teste-endodontia/favorite")
        .set("Authorization", `Bearer ${token}`);
    }
    res = await request(app)
      .get("/api/videos/me/favorites")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it("registra histórico de visualização", async () => {
    const token = await login("test-free@odonto.study", "Senha@123");
    await request(app)
      .post("/api/videos/video-teste-premium/watch")
      .set("Authorization", `Bearer ${token}`);
    const res = await request(app)
      .get("/api/videos/me/history")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });
});
