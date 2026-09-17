import { z } from "zod";

export const registerSchema = z.object({
  nome: z.string().trim().min(1).max(120).optional().nullable(),
  email: z.string().trim().email().max(255),
  senha: z.string().min(6).max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  senha: z.string().min(1).max(128),
});

export const createRoupaSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  categoria: z.string().trim().min(1).max(60),
  cor: z.string().trim().max(60).optional().nullable(),
  tamanho: z.string().trim().max(30).optional().nullable(),
  marca: z.string().trim().max(80).optional().nullable(),
  observacao: z.string().trim().max(1000).optional().nullable(),
  fotoUrl: z.string().url().optional().nullable(),
});

export const createDesejoSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  categoria: z.string().trim().min(1).max(60),
  cor: z.string().trim().max(60).optional().nullable(),
  tamanho: z.string().trim().max(30).optional().nullable(),
  marca: z.string().trim().max(80).optional().nullable(),
  precoAlvo: z.number().nonnegative().optional().nullable(),
  linkRef: z.string().url().optional().nullable(),
  prioridade: z.number().int().min(0).max(2).optional().default(0),
  observacao: z.string().trim().max(1000).optional().nullable(),
  fotoUrl: z.string().url().optional().nullable(),
  comprado: z.boolean().optional().default(false),
});

export const updateDesejoSchema = z
  .object({
    nome: z.string().trim().min(2).max(120).optional(),
    categoria: z.string().trim().min(1).max(60).optional().nullable(),
    cor: z.string().trim().max(60).optional().nullable(),
    tamanho: z.string().trim().max(30).optional().nullable(),
    marca: z.string().trim().max(80).optional().nullable(),
    precoAlvo: z.number().nonnegative().optional().nullable(),
    linkRef: z.string().url().optional().nullable(),
    prioridade: z.number().int().min(0).max(2).optional(),
    observacao: z.string().trim().max(1000).optional().nullable(),
    fotoUrl: z.string().url().optional().nullable(),
    comprado: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Informe ao menos um campo para atualizar",
  });

export const updateRoupaSchema = z
  .object({
    nome: z.string().trim().min(2).max(120).optional(),
    categoria: z.string().trim().min(1).max(60).optional(),
    cor: z.string().trim().max(60).optional().nullable(),
    tamanho: z.string().trim().max(30).optional().nullable(),
    marca: z.string().trim().max(80).optional().nullable(),
    observacao: z.string().trim().max(1000).optional().nullable(),
    fotoUrl: z.string().url().optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Informe ao menos um campo para atualizar",
  });

export const listRoupasQuerySchema = z.object({
  categoria: z.string().trim().optional(),
  busca: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const listDesejosQuerySchema = z.object({
  comprado: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
