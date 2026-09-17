# Closet Back — API REST

Backend do **Closet da Elisa** (guarda-roupa pessoal). Next.js (App Router) + Prisma + Postgres + JWT. Sem UI de produto — apenas Route Handlers em `/api`, consumidos pelo app Flutter.

**Produção:** [https://closet-back.vercel.app](https://closet-back.vercel.app)  
**Health:** `GET /api/health` → `{ "ok": true }`

## Stack

- Next.js 14 (TypeScript, App Router)
- Prisma + PostgreSQL (`DATABASE_URL` + `DIRECT_URL` para migrations)
- Zod (validação)
- JWT com `jose` (HS256, 7 dias)
- Upload: Supabase Storage **ou** Vercel Blob (`STORAGE_PROVIDER`)
- sharp (compressão de fotos)

Todas as rotas autenticadas filtram por `userId` do JWT (isolamento entre contas).

## Setup local

```bash
cp .env.example .env
# edite DATABASE_URL, DIRECT_URL, JWT_SECRET e storage

npm install
npx prisma migrate dev
npx prisma generate
npm run prisma:seed   # opcional — teste@closet.app / senha123
npm run dev           # http://localhost:3000
```

### Postgres (Supabase ou Neon)

1. Crie o projeto e copie as connection strings.
2. `DATABASE_URL` = pooler (runtime); `DIRECT_URL` = conexão direta (migrations).
3. Use `?sslmode=require` e rode `npx prisma migrate dev`.

### Storage

**Supabase Storage** (usado em produção):

```
STORAGE_PROVIDER=supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
SUPABASE_BUCKET=closet-fotos
```

Crie (ou deixe a API criar) um bucket público `closet-fotos`.

**Vercel Blob** (alternativa):

```
STORAGE_PROVIDER=vercel-blob
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

## Deploy na Vercel

1. Importe o repositório `closet-back` (ou conecte o GitHub App da Vercel).
2. Configure as env vars (iguais ao `.env.example`, com valores reais).
3. Build: `prisma generate && next build` (já no `npm run build`).
4. Após o primeiro deploy, rode as migrations:

```bash
npx prisma migrate deploy
```

## Endpoints

| Método | Rota | Auth |
|--------|------|------|
| GET | `/api/health` | não |
| POST | `/api/auth/register` | não |
| POST | `/api/auth/login` | não |
| GET/POST | `/api/roupas` | JWT |
| GET/PUT/DELETE | `/api/roupas/:id` | JWT |
| POST | `/api/roupas/:id/foto` | JWT |
| GET/POST | `/api/desejos` | JWT |
| GET/PUT/DELETE | `/api/desejos/:id` | JWT |
| POST | `/api/desejos/:id/foto` | JWT |
| POST | `/api/desejos/:id/mover` | JWT |

### Roupas

Campos: `nome`, `categoria`, `cor`, `tamanho`, `marca`, `observacao`, `fotoUrl`.

`DELETE /api/roupas/:id` faz **hard delete** (remove do banco e tenta apagar a foto no storage).

### Desejos (wishlist)

Campos: `nome`, `categoria`, `cor`, `tamanho`, `marca`, `precoAlvo`, `linkRef`, `prioridade`, `observacao`, `fotoUrl`, `comprado`.

- `POST /api/desejos/:id/foto` — upload multipart (campo `file`), igual às roupas.
- `POST /api/desejos/:id/mover` — cria uma `Roupa` a partir do desejo (copia foto/campos) e marca o desejo como comprado.

## Exemplos curl

```bash
# Health
curl -s https://closet-back.vercel.app/api/health

# Registrar
curl -s -X POST https://closet-back.vercel.app/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"nome":"Ana","email":"ana@email.com","senha":"senha123"}'

# Login
TOKEN=$(curl -s -X POST https://closet-back.vercel.app/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"ana@email.com","senha":"senha123"}' | jq -r .token)

# Sem token → 401
curl -s -o /dev/null -w "%{http_code}\n" https://closet-back.vercel.app/api/roupas

# Criar desejo
curl -s -X POST https://closet-back.vercel.app/api/desejos \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"nome":"Blazer preto","categoria":"Jaqueta","cor":"Preto","tamanho":"M","prioridade":2}'

# Upload de foto do desejo
curl -s -X POST https://closet-back.vercel.app/api/desejos/DESEJO_ID/foto \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@./foto.jpg"

# Mover desejo → closet
curl -s -X POST https://closet-back.vercel.app/api/desejos/DESEJO_ID/mover \
  -H "Authorization: Bearer $TOKEN"
```

## CORS

`ALLOWED_ORIGINS=*` libera qualquer origem (útil para app mobile). Em produção restrita, liste origens separadas por vírgula.

## Segurança

- Não commite `.env` (só `.env.example` com placeholders).
- `SUPABASE_SERVICE_KEY`, `JWT_SECRET` e `DATABASE_URL` ficam só na Vercel / máquina local.
- Repo público não expõe essas chaves, mas a API continua acessível na internet — a proteção é o JWT + filtro por `userId`.
