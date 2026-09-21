import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL ?? 'admin@futbolaltoque.com';
  const password = process.env.ADMIN_PASSWORD ?? 'admin1234';
  const passwordHash = await argon2.hash(password);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: 'Admin', passwordHash, role: Role.ADMIN },
  });

  console.log(`Admin listo: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
