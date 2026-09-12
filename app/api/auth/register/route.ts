import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { publicUser, signToken } from "@/lib/auth";
import { parseJson } from "@/lib/http";
import {
  badRequest,
  conflict,
  created,
  serverError,
  validationError,
} from "@/lib/response";
import { registerSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await parseJson<unknown>(request);
    if (body === null) {
      return badRequest("INVALID_JSON", "Body JSON inválido");
    }

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return validationError("Dados de registro inválidos", parsed.error.flatten());
    }

    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return conflict("EMAIL_EXISTS", "E-mail já cadastrado");
    }

    const senhaHash = await bcrypt.hash(parsed.data.senha, 10);
    const user = await prisma.user.create({
      data: {
        email,
        senhaHash,
        nome: parsed.data.nome ?? null,
      },
    });

    const token = await signToken({ sub: user.id, email: user.email });
    return created({ user: publicUser(user), token });
  } catch (err) {
    console.error("register error", err);
    return serverError();
  }
}
