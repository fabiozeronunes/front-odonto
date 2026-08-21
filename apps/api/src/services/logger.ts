import pino from "pino";
import { env } from "../config/env.js";

export const logger = pino({
  level: env.nodeEnv === "production" ? "info" : "debug",
  transport: env.nodeEnv !== "production" ? { target: "pino-pretty", options: { colorize: true } } : undefined,
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  redact: ["req.headers.authorization", "req.headers.cookie", "password", "passwordHash"],
});

export function childLogger(context: Record<string, unknown>) {
  return logger.child(context);
}
