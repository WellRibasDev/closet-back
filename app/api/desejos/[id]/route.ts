import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { parseJson, requireUserId } from "@/lib/http";
import { deleteFoto } from "@/lib/storage";
import {
  badRequest,
  notFound,
  ok,
  serverError,
  validationError,
} from "@/lib/response";
import { updateDesejoSchema } from "@/lib/validators";

type Params = { params: { id: string } };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { userId, error } = await requireUserId(request);
    if (error || !userId) return error!;

    const { id } = params;
    const desejo = await prisma.desejo.findFirst({
      where: { id, userId },
    });

    if (!desejo) {
      return notFound("DESEJO_NOT_FOUND", "Desejo não encontrado");
    }

    return ok(desejo);
  } catch (err) {
    console.error("get desejo error", err);
    return serverError();
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { userId, error } = await requireUserId(request);
    if (error || !userId) return error!;

    const { id } = params;
    const existing = await prisma.desejo.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return notFound("DESEJO_NOT_FOUND", "Desejo não encontrado");
    }

    const body = await parseJson<unknown>(request);
    if (body === null) {
      return badRequest("INVALID_JSON", "Body JSON inválido");
    }

    const parsed = updateDesejoSchema.safeParse(body);
    if (!parsed.success) {
      return validationError("Dados do desejo inválidos", parsed.error.flatten());
    }

    const previousFoto = existing.fotoUrl;
    const desejo = await prisma.desejo.update({
      where: { id },
      data: parsed.data,
    });

    if (
      parsed.data.fotoUrl !== undefined &&
      previousFoto &&
      previousFoto !== parsed.data.fotoUrl
    ) {
      await deleteFoto(previousFoto);
    }

    return ok(desejo);
  } catch (err) {
    console.error("update desejo error", err);
    return serverError();
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { userId, error } = await requireUserId(request);
    if (error || !userId) return error!;

    const { id } = params;
    const existing = await prisma.desejo.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return notFound("DESEJO_NOT_FOUND", "Desejo não encontrado");
    }

    await prisma.desejo.delete({ where: { id } });
    await deleteFoto(existing.fotoUrl);

    return ok({ ok: true });
  } catch (err) {
    console.error("delete desejo error", err);
    return serverError();
  }
}
