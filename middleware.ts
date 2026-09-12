import { NextRequest, NextResponse } from "next/server";

function getAllowedOrigins(): string[] {
  const raw = process.env.ALLOWED_ORIGINS || "*";
  return raw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

function resolveOrigin(request: NextRequest): string {
  const allowed = getAllowedOrigins();
  const requestOrigin = request.headers.get("origin");

  if (allowed.includes("*")) return "*";
  if (requestOrigin && allowed.includes(requestOrigin)) return requestOrigin;
  return allowed[0] || "*";
}

function applyCors(request: NextRequest, response: NextResponse) {
  const origin = resolveOrigin(request);
  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type"
  );
  response.headers.set("Access-Control-Max-Age", "86400");
  if (origin !== "*") {
    response.headers.set("Vary", "Origin");
  }
  return response;
}

export function middleware(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return applyCors(request, new NextResponse(null, { status: 204 }));
  }

  return applyCors(request, NextResponse.next());
}

export const config = {
  matcher: ["/api/:path*"],
};
