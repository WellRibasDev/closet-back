import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/http";
import { deleteFoto, UploadError, uploadFoto } from "@/lib/storage";
import {
  badRequest,
  notFound,
  ok,
  serverError,
} from "@/lib/response";

export const runtime = "nodejs";

type Params = { params: { id: string } };

export async function POST(request: NextRequest, { params }: Params) {
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

    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return badRequest(
        "MISSING_FILE",
        "Envie o campo 'file' em multipart/form-data"
      );
    }

    const fotoUrl = await uploadFoto(userId, file);
    const previousFoto = existing.fotoUrl;

    const roupa = await prisma.roupa.update({
      where: { id },
      data: { fotoUrl },
    });

    if (previousFoto && previousFoto !== fotoUrl) {
      await deleteFoto(previousFoto);
    }

    return ok({ fotoUrl: roupa.fotoUrl, roupa });
  } catch (err) {
    if (err instanceof UploadError) {
      return badRequest(err.code, err.message);
    }
    console.error("upload foto error", err);
    return serverError();
  }
}
