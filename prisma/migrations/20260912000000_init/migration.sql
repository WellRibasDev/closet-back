-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "nome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Roupa" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "cor" TEXT,
    "tamanho" TEXT,
    "marca" TEXT,
    "observacao" TEXT,
    "fotoUrl" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Roupa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Desejo" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" TEXT,
    "precoAlvo" DOUBLE PRECISION,
    "linkRef" TEXT,
    "prioridade" INTEGER NOT NULL DEFAULT 0,
    "observacao" TEXT,
    "fotoUrl" TEXT,
    "comprado" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Desejo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Roupa_userId_categoria_idx" ON "Roupa"("userId", "categoria");

-- CreateIndex
CREATE INDEX "Desejo_userId_comprado_idx" ON "Desejo"("userId", "comprado");

-- AddForeignKey
ALTER TABLE "Roupa" ADD CONSTRAINT "Roupa_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Desejo" ADD CONSTRAINT "Desejo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
