import { Request, Response, NextFunction } from "express";
import { logAudit } from "../services/audit.js";
import { AuthenticatedRequest } from "../types/auth.js";

/**
 * Middleware that logs audit events after the response is sent.
 * Use as a post-middleware on sensitive routes.
 */
export function auditLog(action: string, resource?: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    // Run audit logging after the response
    const originalSend = _res.send;
    _res.send = function (body) {
      // Log the audit event asynchronously
      const authReq = req as AuthenticatedRequest;
      logAudit({
        userId: authReq.user?.id,
        action,
        resource,
        resourceId: req.params?.id,
        details: {
          method: req.method,
          path: req.path,
          statusCode: _res.statusCode,
          body: req.method !== "GET" ? sanitizeBody(req.body) : undefined,
        },
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers["user-agent"],
      }).catch(() => {}); // Don't await, fire and forget

      return originalSend.call(this, body);
    };
    next();
  };
}

/**
 * Remove dados sensíveis do body antes de logar
 */
function sanitizeBody(body: any): any {
  if (!body || typeof body !== "object") return body;

  const sensitiveFields = ["password", "passwordHash", "currentPassword", "newPassword", "token", "refreshToken"];
  const sanitized = { ...body };

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = "[REDACTED]";
    }
  }

  return sanitized;
}
