import { SignJWT, jwtVerify } from "jose";
import { NextRequest } from "next/server";

const JWT_ISSUER = "closet-back";
const JWT_AUDIENCE = "closet-app";
const JWT_EXPIRATION = "7d";

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("JWT_SECRET deve ter pelo menos 16 caracteres");
  }
  return new TextEncoder().encode(secret);
}

export type JwtPayload = {
  sub: string;
  email: string;
};

export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRATION)
    .sign(getSecretKey());
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, getSecretKey(), {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });

  if (!payload.sub || typeof payload.email !== "string") {
    throw new Error("Token inválido");
  }

  return {
    sub: payload.sub,
    email: payload.email,
  };
}

export function extractBearerToken(request: NextRequest | Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;

  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export async function getUserId(request: NextRequest | Request): Promise<string | null> {
  const token = extractBearerToken(request);
  if (!token) return null;

  try {
    const payload = await verifyToken(token);
    return payload.sub;
  } catch {
    return null;
  }
}

export function publicUser(user: {
  id: string;
  email: string;
  nome: string | null;
  fotoUrl?: string | null;
  createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    nome: user.nome,
    fotoUrl: user.fotoUrl ?? null,
    createdAt: user.createdAt,
  };
}
