import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { publicUser, signToken } from "@/lib/auth";
import { parseJson } from "@/lib/http";
import {
  badRequest,
  ok,
  serverError,
  unauthorized,
  validationError,
} from "@/lib/response";
import { loginSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await parseJson<unknown>(request);
    if (body === null) {
      return badRequest("INVALID_JSON", "Body JSON inválido");
    }

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return validationError("Dados de login inválidos", parsed.error.flatten());
    }

    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return unauthorized("INVALID_CREDENTIALS", "E-mail ou senha inválidos");
    }

    const valid = await bcrypt.compare(parsed.data.senha, user.senhaHash);
    if (!valid) {
      return unauthorized("INVALID_CREDENTIALS", "E-mail ou senha inválidos");
    }

    const token = await signToken({ sub: user.id, email: user.email });
    return ok({ user: publicUser(user), token });
  } catch (err) {
    console.error("login error", err);
    return serverError();
  }
}
