import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { publicUser } from "@/lib/auth";
import { requireUserId } from "@/lib/http";
import { deleteFoto, UploadError, uploadFoto } from "@/lib/storage";
import {
  badRequest,
  notFound,
  ok,
  serverError,
} from "@/lib/response";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { userId, error } = await requireUserId(request);
    if (error || !userId) return error!;

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      return notFound("USER_NOT_FOUND", "Usuário não encontrado");
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

    const user = await prisma.user.update({
      where: { id: userId },
      data: { fotoUrl },
    });

    if (previousFoto && previousFoto !== fotoUrl) {
      await deleteFoto(previousFoto);
    }

    return ok({ user: publicUser(user), fotoUrl: user.fotoUrl });
  } catch (err) {
    if (err instanceof UploadError) {
      return badRequest(err.code, err.message);
    }
    console.error("upload foto perfil error", err);
    return serverError();
  }
}
