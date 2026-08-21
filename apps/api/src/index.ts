import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { applyMigrations } from "./services/migrate.js";
import { logger } from "./services/logger.js";

async function main() {
  applyMigrations().catch(() => {});
  const app = createApp();

  const server = app.listen(env.port, () => {
    logger.info({ port: env.port }, "API odontologia-study rodando");
  });

  let isShuttingDown = false;

  const shutdown = async () => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    logger.info("Encerrando servidor...");

    server.close(async () => {
      logger.info("Servidor HTTP fechado");
      await prisma.$disconnect();
      logger.info("Banco desconectado");
      process.exit(0);
    });

    setTimeout(() => {
      logger.error("Timeout no shutdown, forçando saída");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  logger.error({ err }, "Falha ao iniciar a API");
  process.exit(1);
});
