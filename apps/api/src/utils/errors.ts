export class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Recurso não encontrado") {
    super(404, message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Acesso negado") {
    super(403, message);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Não autenticado") {
    super(401, message);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(409, message);
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(400, message, details);
  }
}
