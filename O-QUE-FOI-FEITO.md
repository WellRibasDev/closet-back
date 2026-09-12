# Closet Back — O que foi implementado

Documento gerado a partir da aplicação do `closet-back-SPEC.md` na pasta `closet-back/`.

## Visão geral

API REST de guarda-roupa pessoal em **Next.js 14 (App Router) + TypeScript**, sem frontend de produto — apenas Route Handlers em `/api`, consumida pelo app Flutter.

Deploy-ready para **Vercel**, com Postgres (Supabase/Neon) via Prisma.

---

## Stack

| Tecnologia | Uso |
|---|---|
| Next.js 14 App Router | API (`app/api/**`) |
| Prisma + PostgreSQL | Persistência |
| Zod | Validação de body/query |
| jose | JWT (register/login) |
| bcryptjs | Hash de senha |
| @vercel/blob **ou** Supabase Storage | Upload de fotos (`STORAGE_PROVIDER`) |
| sharp | Compressão/redimensionamento de imagens |
| Middleware | CORS (`ALLOWED_ORIGINS`) |

---

## Estrutura criada

```
closet-back/
  app/
    api/
      health/route.ts
      auth/register/route.ts
      auth/login/route.ts
      roupas/route.ts              # GET listar + POST criar
      roupas/[id]/route.ts         # GET, PUT, DELETE
      roupas/[id]/foto/route.ts    # POST upload multipart
      desejos/route.ts             # GET + POST
      desejos/[id]/route.ts        # GET, PUT, DELETE
      desejos/[id]/mover/route.ts  # POST desejo → roupa
    layout.tsx
    page.tsx                       # página mínima apontando para /api
  lib/
    db.ts                          # PrismaClient singleton
    auth.ts                        # sign/verify JWT, getUserId
    storage.ts                     # uploadFoto / deleteFoto
    validators.ts                  # schemas Zod
    response.ts                    # ok, created, badRequest, etc.
    http.ts                        # requireUserId, parseJson
  prisma/
    schema.prisma                  # User, Roupa, Desejo
    migrations/..._init/           # migration inicial
    seed.ts                        # usuário teste + 5 roupas
  middleware.ts                    # CORS + OPTIONS
  .env.example
  README.md
  package.json
  next.config.mjs
```

---

## Modelos (Prisma)

- **User** — email, senhaHash, nome, relações com Roupa/Desejo
- **Roupa** — nome, categoria, cor, tamanho, marca, observacao, fotoUrl, userId
- **Desejo** — nome, categoria, precoAlvo, linkRef, prioridade, observacao, fotoUrl, comprado, userId

Índices: `(userId, categoria)` em Roupa e `(userId, comprado)` em Desejo.

`DIRECT_URL` foi adicionado no schema para migrations com pooler do Supabase (`pgbouncer`).

---

## Endpoints

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/api/health` | não | `{ ok: true }` |
| POST | `/api/auth/register` | não | cria user + JWT |
| POST | `/api/auth/login` | não | login + JWT |
| GET | `/api/roupas` | JWT | lista paginada (`categoria`, `busca`, `page`, `limit`) |
| POST | `/api/roupas` | JWT | cria roupa |
| GET/PUT/DELETE | `/api/roupas/:id` | JWT | detalha / edita / **hard delete** (+ apaga foto) |
| POST | `/api/roupas/:id/foto` | JWT | upload `file` → `fotoUrl` |
| GET/POST | `/api/desejos` | JWT | lista / cria wishlist |
| GET/PUT/DELETE | `/api/desejos/:id` | JWT | CRUD desejo |
| POST | `/api/desejos/:id/mover` | JWT | cria Roupa a partir do Desejo e marca `comprado=true` |

Respostas de erro no padrão: `{ error, message }`.

---

## Regras de negócio aplicadas

1. Isolamento por `userId` em todas as queries de roupas/desejos.
2. `nome` (min 2) e `categoria` obrigatórios.
3. DELETE de roupa é **hard delete** + remoção best-effort da foto no storage.
4. Upload: jpg/jpeg/png/webp, máx 5MB, path `userId/uuid.ext`, compressão com sharp.
5. Mover desejo → copia `nome`, `categoria`, `fotoUrl`, `observacao`.
6. Paginação default `page=1&limit=20`, máx `limit=100`.

---

## Auth

- Register/login retornam `{ user, token }`.
- Rotas protegidas leem `Authorization: Bearer <token>`.
- JWT HS256 via `jose`, validade 7 dias, secret em `JWT_SECRET`.

---

## Storage

Controlado por `STORAGE_PROVIDER`:

- `vercel-blob` → `BLOB_READ_WRITE_TOKEN`
- `supabase` → `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` (+ bucket `closet-fotos`)

---

## Banco / ambiente

Configurado para **Supabase Postgres** com:

- `DATABASE_URL` — pooler transaction (`6543`, `pgbouncer=true`) — runtime
- `DIRECT_URL` — pooler session (`5432`) — migrations Prisma

Projeto apontado no `.env` local (não versionado): `owskcmtfuksqnkwlyuey`.

Seed opcional: `teste@closet.app` / `senha123` + 5 roupas.

---

## Como rodar

```bash
cp .env.example .env   # preencher DATABASE_URL, DIRECT_URL, JWT_SECRET
npm install
npx prisma migrate deploy
npx prisma generate
npm run prisma:seed    # opcional
npm run dev            # http://localhost:3000
```

Build verificado: `npm run build` passou (rotas geradas corretamente).

---

## Critérios do SPEC — status

- [x] `GET /api/health` → `{ ok: true }`
- [x] Register + login com JWT
- [x] Sem token → `401` em `/api/roupas`
- [x] CRUD de roupas
- [x] Upload de foto (quando storage configurado)
- [x] CRUD + mover wishlist
- [x] `npm run build` ok
- [x] README com setup local, Supabase/Neon e deploy Vercel

---

## Fora do escopo / não alterado

- App Flutter (`flutter-front/`) — não foi modificado.
- Commit/push do código completo — o usuário gerenciou o remote GitHub à parte.
