import { NextRequest } from "next/server";
import { getUserId } from "@/lib/auth";
import { unauthorized } from "@/lib/response";

export async function requireUserId(request: NextRequest | Request) {
  const userId = await getUserId(request);
  if (!userId) {
    return { userId: null as string | null, error: unauthorized() };
  }
  return { userId, error: null };
}

export async function parseJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}
