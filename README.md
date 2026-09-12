# Closet Back — API REST

Backend do app de guarda-roupa pessoal. Next.js (App Router) + Prisma + Postgres + JWT. Sem UI — apenas Route Handlers em `/api`.

## Stack

- Next.js 14 (TypeScript, App Router)
- Prisma + PostgreSQL (`DATABASE_URL`)
- Zod (validação)
- JWT com `jose`
- Upload: Vercel Blob **ou** Supabase Storage (`STORAGE_PROVIDER`)

## Exclusão de roupas

`DELETE /api/roupas/:id` faz **hard delete**: remove o registro do banco e tenta apagar a foto no storage (se a URL for do provider configurado). Resposta: `{ "ok": true }`.

## Setup local

```bash
cp .env.example .env
# edite DATABASE_URL, JWT_SECRET e tokens de storage

npm install
npx prisma migrate dev
npx prisma generate
npm run prisma:seed   # opcional — teste@closet.app / senha123
npm run dev           # http://localhost:3000
```

### Postgres (Neon ou Supabase)

1. Crie um projeto no [Neon](https://neon.tech) ou [Supabase](https://supabase.com).
2. Copie a connection string para `DATABASE_URL` (use `?sslmode=require`).
3. Rode `npx prisma migrate dev`.

### Storage

**Vercel Blob** (padrão):

```
STORAGE_PROVIDER=vercel-blob
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

**Supabase Storage**:

```
STORAGE_PROVIDER=supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
```

Crie um bucket público `closet-fotos` (ou defina `SUPABASE_BUCKET`).

## Deploy na Vercel

1. Importe o repositório `closet-back` na Vercel.
2. Configure as env vars (mesmas do `.env.example`).
3. Build command: `prisma generate && next build` (já no `npm run build`).
4. Após o primeiro deploy, rode as migrations:

```bash
npx prisma migrate deploy
```

(ou use um script de release / GitHub Action).

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
| POST | `/api/desejos/:id/mover` | JWT |

## Exemplos curl

```bash
# Health
curl -s http://localhost:3000/api/health

# Registrar
curl -s -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"nome":"Ana","email":"ana@email.com","senha":"senha123"}'

# Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"ana@email.com","senha":"senha123"}' | jq -r .token)

# Sem token → 401
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/roupas

# Criar roupa
curl -s -X POST http://localhost:3000/api/roupas \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"nome":"Jaqueta jeans","categoria":"Jaqueta","cor":"Azul","tamanho":"M"}'

# Listar
curl -s "http://localhost:3000/api/roupas?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"

# Upload de foto (campo file)
curl -s -X POST http://localhost:3000/api/roupas/ROUPA_ID/foto \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@./foto.jpg"

# Wishlist + mover para closet
curl -s -X POST http://localhost:3000/api/desejos \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"nome":"Blazer preto","categoria":"Jaqueta","prioridade":2}'

curl -s -X POST http://localhost:3000/api/desejos/DESEJO_ID/mover \
  -H "Authorization: Bearer $TOKEN"
```

## CORS

Em desenvolvimento, `ALLOWED_ORIGINS=*` libera qualquer origem (Flutter mobile não tem origin fixa). Em produção, liste origens conhecidas separadas por vírgula se necessário.
# closet-back
