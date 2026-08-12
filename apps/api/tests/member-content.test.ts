import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

const app = createApp();

async function login(email: string, password: string) {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  return res.body.tokens.accessToken as string;
}

describe("Conteúdo por membro", () => {
  it("membro cria vídeo com observações e imagens e lista em /me", async () => {
    const token = await login("test-free@odonto.study", "Senha@123");
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
    const token = await login("test-free@odonto.study", "Senha@123");
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

  it("membro pode criar tag p/ uso próprio e ela aparece no catálogo", async () => {
    const token = await login("test-free@odonto.study", "Senha@123");
    const res = await request(app)
      .post("/api/tags")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: `Tag do membro ${Date.now()}` });
    expect(res.status).toBe(201);

    const pub = await request(app).get("/api/tags");
    expect(pub.status).toBe(200);
    expect(pub.body.data.some((t: { id: string }) => t.id === res.body.data.id)).toBe(true);
  });
});