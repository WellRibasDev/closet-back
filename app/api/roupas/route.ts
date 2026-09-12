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
import { createRoupaSchema, listRoupasQuerySchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  try {
    const { userId, error } = await requireUserId(request);
    if (error || !userId) return error!;

    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = listRoupasQuerySchema.safeParse(params);
    if (!parsed.success) {
      return validationError("Query inválida", parsed.error.flatten());
    }

    const { categoria, busca, page, limit } = parsed.data;
    const where: Prisma.RoupaWhereInput = { userId };

    if (categoria) {
      where.categoria = { equals: categoria, mode: "insensitive" };
    }

    if (busca) {
      where.OR = [
        { nome: { contains: busca, mode: "insensitive" } },
        { marca: { contains: busca, mode: "insensitive" } },
        { cor: { contains: busca, mode: "insensitive" } },
        { observacao: { contains: busca, mode: "insensitive" } },
      ];
    }

    const [total, data] = await Promise.all([
      prisma.roupa.count({ where }),
      prisma.roupa.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return ok({ data, page, limit, total });
  } catch (err) {
    console.error("list roupas error", err);
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

    const parsed = createRoupaSchema.safeParse(body);
    if (!parsed.success) {
      return validationError("Dados da roupa inválidos", parsed.error.flatten());
    }

    const roupa = await prisma.roupa.create({
      data: {
        ...parsed.data,
        userId,
      },
    });

    return created(roupa);
  } catch (err) {
    console.error("create roupa error", err);
    return serverError();
  }
}
