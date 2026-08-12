import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

const app = createApp();

describe("Auth", () => {
  it("registra um novo usuário", async () => {
    const email = `aluno-${Date.now()}@test.com`;
    const res = await request(app).post("/api/auth/register").send({
      name: "Aluno Teste",
      email,
      password: "Senha@123",
    });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(email);
    expect(res.body.user.role).toBe("USER");
    expect(res.body.tokens.accessToken).toBeDefined();
    expect(res.body.tokens.refreshToken).toBeDefined();
  });

  it("rejeita e-mail duplicado", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Aluno Teste",
      email: "test-free@odonto.study",
      password: "Senha@123",
    });
    expect(res.status).toBe(409);
  });

  it("rejeita credenciais inválidas", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "test-free@odonto.study",
      password: "senha-errada",
    });
    expect(res.status).toBe(401);
  });

  it("faz login com sucesso", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "test-free@odonto.study",
      password: "Senha@123",
    });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("test-free@odonto.study");
    expect(res.body.tokens.accessToken).toBeDefined();
  });

  it("retorna o perfil autenticado via /me", async () => {
    const login = await request(app).post("/api/auth/login").send({
      email: "test-free@odonto.study",
      password: "Senha@123",
    });
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${login.body.tokens.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("test-free@odonto.study");
  });

  it("bloqueia /me sem token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("renova o access token via refresh", async () => {
    const login = await request(app).post("/api/auth/login").send({
      email: "test-free@odonto.study",
      password: "Senha@123",
    });
    const res = await request(app).post("/api/auth/refresh").send({
      refreshToken: login.body.tokens.refreshToken,
    });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });
});
