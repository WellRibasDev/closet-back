import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { parseJson, requireUserId } from "@/lib/http";
import {
  badRequest,
  created,
  ok,
  serverError,
  validationError,
} from "@/lib/response";
import { createDesejoSchema, listDesejosQuerySchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  try {
    const { userId, error } = await requireUserId(request);
    if (error || !userId) return error!;

    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = listDesejosQuerySchema.safeParse(params);
    if (!parsed.success) {
      return validationError("Query inválida", parsed.error.flatten());
    }

    const { comprado, page, limit } = parsed.data;
    const where: Prisma.DesejoWhereInput = { userId };

    if (comprado !== undefined) {
      where.comprado = comprado;
    }

    const [total, data] = await Promise.all([
      prisma.desejo.count({ where }),
      prisma.desejo.findMany({
        where,
        orderBy: [{ prioridade: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return ok({ data, page, limit, total });
  } catch (err) {
    console.error("list desejos error", err);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, error } = await requireUserId(request);
    if (error || !userId) return error!;

    const body = await parseJson<unknown>(request);
    if (body === null) {
      return badRequest("INVALID_JSON", "Body JSON inválido");
    }

    const parsed = createDesejoSchema.safeParse(body);
    if (!parsed.success) {
      return validationError("Dados do desejo inválidos", parsed.error.flatten());
    }

    const desejo = await prisma.desejo.create({
      data: {
        ...parsed.data,
        userId,
      },
    });

    return created(desejo);
  } catch (err) {
    console.error("create desejo error", err);
    return serverError();
  }
}
