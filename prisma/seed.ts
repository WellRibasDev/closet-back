import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "teste@closet.app";
  const senhaHash = await bcrypt.hash("senha123", 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      nome: "Usuário Teste",
      senhaHash,
    },
  });

  const count = await prisma.roupa.count({ where: { userId: user.id } });
  if (count === 0) {
    await prisma.roupa.createMany({
      data: [
        {
          nome: "Camiseta branca básica",
          categoria: "Camiseta",
          cor: "Branco",
          tamanho: "M",
          marca: "Hering",
          userId: user.id,
        },
        {
          nome: "Calça jeans skinny",
          categoria: "Calça",
          cor: "Azul",
          tamanho: "40",
          marca: "Levis",
          userId: user.id,
        },
        {
          nome: "Jaqueta jeans",
          categoria: "Jaqueta",
          cor: "Azul",
          tamanho: "M",
          marca: "Renner",
          observacao: "Uso no frio leve",
          userId: user.id,
        },
        {
          nome: "Tênis branco",
          categoria: "Sapato",
          cor: "Branco",
          tamanho: "41",
          marca: "Nike",
          userId: user.id,
        },
        {
          nome: "Vestido floral",
          categoria: "Vestido",
          cor: "Estampado",
          tamanho: "P",
          marca: "Zara",
          userId: user.id,
        },
      ],
    });
  }

  console.log("Seed OK — usuário:", email, "/ senha: senha123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
