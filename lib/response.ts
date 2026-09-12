import { NextResponse } from "next/server";

type ErrorBody = {
  error: string;
  message: string;
};

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, { status: 200, ...init });
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function badRequest(error: string, message: string) {
  return NextResponse.json({ error, message } satisfies ErrorBody, {
    status: 400,
  });
}

export function unauthorized(
  error = "UNAUTHORIZED",
  message = "Token ausente ou inválido"
) {
  return NextResponse.json({ error, message } satisfies ErrorBody, {
    status: 401,
  });
}

export function forbidden(
  error = "FORBIDDEN",
  message = "Acesso negado"
) {
  return NextResponse.json({ error, message } satisfies ErrorBody, {
    status: 403,
  });
}

export function notFound(error: string, message: string) {
  return NextResponse.json({ error, message } satisfies ErrorBody, {
    status: 404,
  });
}

export function conflict(error: string, message: string) {
  return NextResponse.json({ error, message } satisfies ErrorBody, {
    status: 409,
  });
}

export function serverError(
  error = "INTERNAL_ERROR",
  message = "Erro interno do servidor"
) {
  return NextResponse.json({ error, message } satisfies ErrorBody, {
    status: 500,
  });
}

export function validationError(message: string, details?: unknown) {
  return NextResponse.json(
    { error: "VALIDATION_ERROR", message, details },
    { status: 400 }
  );
}
