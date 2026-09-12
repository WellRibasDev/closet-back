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
import { updateRoupaSchema } from "@/lib/validators";

type Params = { params: { id: string } };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { userId, error } = await requireUserId(request);
    if (error || !userId) return error!;

    const { id } = params;
    const roupa = await prisma.roupa.findFirst({
      where: { id, userId },
    });

    if (!roupa) {
      return notFound("ROUPA_NOT_FOUND", "Roupa não encontrada");
    }

    return ok(roupa);
  } catch (err) {
    console.error("get roupa error", err);
    return serverError();
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { userId, error } = await requireUserId(request);
    if (error || !userId) return error!;

    const { id } = params;
    const existing = await prisma.roupa.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return notFound("ROUPA_NOT_FOUND", "Roupa não encontrada");
    }

    const body = await parseJson<unknown>(request);
    if (body === null) {
      return badRequest("INVALID_JSON", "Body JSON inválido");
    }

    const parsed = updateRoupaSchema.safeParse(body);
    if (!parsed.success) {
      return validationError("Dados da roupa inválidos", parsed.error.flatten());
    }

    const previousFoto = existing.fotoUrl;
    const roupa = await prisma.roupa.update({
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

    return ok(roupa);
  } catch (err) {
    console.error("update roupa error", err);
    return serverError();
  }
}

/**
 * Hard delete: remove o registro e tenta apagar a foto no storage.
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { userId, error } = await requireUserId(request);
    if (error || !userId) return error!;

    const { id } = params;
    const existing = await prisma.roupa.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return notFound("ROUPA_NOT_FOUND", "Roupa não encontrada");
    }

    await prisma.roupa.delete({ where: { id } });
    await deleteFoto(existing.fotoUrl);

    return ok({ ok: true });
  } catch (err) {
    console.error("delete roupa error", err);
    return serverError();
  }
}
