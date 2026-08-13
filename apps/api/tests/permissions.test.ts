import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

const app = createApp();

async function login(email: string, password: string) {
  const res = await request(app).post("/api/auth/login").send({ email, password });
  return res.body.tokens.accessToken as string;
}

describe("Permissões administrativas", () => {
  it("bloqueia dashboard para usuário comum", async () => {
    const token = await login("test-free@odonto.study", "Senha@123");
    const res = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("bloqueia dashboard sem token", async () => {
    const res = await request(app).get("/api/admin/dashboard");
    expect(res.status).toBe(401);
  });

  it("permite dashboard para admin", async () => {
    const token = await login("test-admin@odonto.study", "Admin@123");
    const res = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.users.total).toBeGreaterThanOrEqual(0);
    expect(res.body.data.content).toBeDefined();
  });

  it("permite que membro com plano pago crie especialidade própria", async () => {
    const token = await login("test-paid@odonto.study", "Senha@123");
    const res = await request(app)
      .post("/api/specialties")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: `Minha Especialidade ${Date.now()}` });
    expect(res.status).toBe(201);
  });

  it("bloqueia membro ao editar especialidade de outro usuário", async () => {
    const adminToken = await login("test-admin@odonto.study", "Admin@123");
    const admin = await request(app)
      .post("/api/specialties")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: `Esp do Admin ${Date.now()}` });
    expect(admin.status).toBe(201);
    const otherId = admin.body.data.id;

    const token = await login("test-paid@odonto.study", "Senha@123");
    const res = await request(app)
      .put(`/api/specialties/${otherId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ description: "tentativa" });
    expect(res.status).toBe(403);
  });

  it("permite criar especialidade para admin", async () => {
    const token = await login("test-admin@odonto.study", "Admin@123");
    const res = await request(app)
      .post("/api/specialties")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: `Especialidade ${Date.now()}` });
    expect(res.status).toBe(201);
  });
});

describe("Validação de entrada", () => {
  it("rejeita cadastro sem e-mail válido", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "X",
      email: "email-invalido",
      password: "Senha@123",
    });
    expect(res.status).toBe(400);
  });

  it("rejeita cadastro com senha curta", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "X",
      email: "x@test.com",
      password: "123",
    });
    expect(res.status).toBe(400);
  });
});
