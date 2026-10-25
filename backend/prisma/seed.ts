import { PrismaClient } from '@prisma/client';
import { validateAdminSeedEnv } from '../src/admin-seed/admin-seed-env.schema';
import { upsertAdminUser } from '../src/admin-seed/upsert-admin-user';

async function main() {
  const env = validateAdminSeedEnv(process.env);

  const prisma = new PrismaClient();
  try {
    await upsertAdminUser(prisma, env);
    console.log(`Admin listo: ${env.ADMIN_EMAIL}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
