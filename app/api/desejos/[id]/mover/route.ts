import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/http";
import {
  conflict,
  created,
  notFound,
  serverError,
} from "@/lib/response";

type Params = { params: { id: string } };

/**
 * Cria uma Roupa a partir do Desejo e marca comprado=true.
 * Copia: nome, categoria, fotoUrl, observacao.
 */
export async function POST(request: NextRequest, { params }: Params) {
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

    if (desejo.comprado) {
      return conflict(
        "DESEJO_JA_COMPRADO",
        "Este desejo já foi movido para o closet"
      );
    }

    const categoria = desejo.categoria?.trim();
    if (!categoria) {
      return conflict(
        "DESEJO_SEM_CATEGORIA",
        "Defina uma categoria no desejo antes de mover"
      );
    }

    const roupa = await prisma.$transaction(async (tx) => {
      const createdRoupa = await tx.roupa.create({
        data: {
          nome: desejo.nome,
          categoria,
          fotoUrl: desejo.fotoUrl,
          observacao: desejo.observacao,
          userId,
        },
      });

      await tx.desejo.update({
        where: { id },
        data: { comprado: true },
      });

      return createdRoupa;
    });

    return created(roupa);
  } catch (err) {
    console.error("mover desejo error", err);
    return serverError();
  }
}
