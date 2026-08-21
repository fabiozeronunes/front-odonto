import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { applyMigrations } from "./services/migrate.js";

async function main() {
  await applyMigrations();
  const app = createApp();

  const server = app.listen(env.port, () => {
    console.log(`API odontologia-study rodando em ${env.apiUrl}`);
  });

  const shutdown = async () => {
    console.log("Encerrando servidor...");
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Falha ao iniciar a API:", err);
  process.exit(1);
});
