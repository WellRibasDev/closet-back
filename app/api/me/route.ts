import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { publicUser } from "@/lib/auth";
import { parseJson, requireUserId } from "@/lib/http";
import {
  badRequest,
  notFound,
  ok,
  serverError,
  unauthorized,
  validationError,
} from "@/lib/response";
import { updateMeSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { userId, error } = await requireUserId(request);
    if (error || !userId) return error!;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return notFound("USER_NOT_FOUND", "Usuário não encontrado");
    }

    return ok({ user: publicUser(user) });
  } catch (err) {
    console.error("me get error", err);
    return serverError();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId, error } = await requireUserId(request);
    if (error || !userId) return error!;

    const body = await parseJson<unknown>(request);
    if (body === null) {
      return badRequest("INVALID_JSON", "Body JSON inválido");
    }

    const parsed = updateMeSchema.safeParse(body);
    if (!parsed.success) {
      return validationError("Dados inválidos", parsed.error.flatten());
    }

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      return notFound("USER_NOT_FOUND", "Usuário não encontrado");
    }

    const data: { nome?: string | null; email?: string; senhaHash?: string } =
      {};

    if (parsed.data.nome !== undefined) {
      data.nome = parsed.data.nome;
    }

    if (parsed.data.email !== undefined) {
      const email = parsed.data.email.toLowerCase();
      if (email !== existing.email) {
        const taken = await prisma.user.findUnique({ where: { email } });
        if (taken) {
          return badRequest(
            "EMAIL_IN_USE",
            "Este e-mail já está em uso por outra conta"
          );
        }
        data.email = email;
      }
    }

    if (parsed.data.novaSenha) {
      if (!parsed.data.senhaAtual) {
        return badRequest(
          "SENHA_ATUAL_REQUIRED",
          "Informe a senha atual para alterar a senha"
        );
      }
      const valid = await bcrypt.compare(
        parsed.data.senhaAtual,
        existing.senhaHash
      );
      if (!valid) {
        return unauthorized("INVALID_PASSWORD", "Senha atual incorreta");
      }
      data.senhaHash = await bcrypt.hash(parsed.data.novaSenha, 10);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });

    return ok({ user: publicUser(user) });
  } catch (err) {
    console.error("me put error", err);
    return serverError();
  }
}
