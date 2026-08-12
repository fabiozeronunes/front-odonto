import type { Role } from "@prisma/client";
import type { Request } from "express";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  planId: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}
