import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash("admin123", 10);

  const user = await prisma.user.upsert({
    where: { email: "admin@loo.ch" },
    update: {},
    create: {
      email: "admin@loo.ch",
      password,
      name: "Администратор",
    },
  });

  console.log("Создан пользователь:", user.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
