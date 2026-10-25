import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';
import { AdminSeedEnv } from './admin-seed-env.schema';

export async function upsertAdminUser(
  prisma: PrismaClient,
  env: AdminSeedEnv,
): Promise<void> {
  const passwordHash = await argon2.hash(env.ADMIN_PASSWORD);

  await prisma.user.upsert({
    where: { email: env.ADMIN_EMAIL },
    update: { passwordHash, role: Role.ADMIN },
    create: {
      email: env.ADMIN_EMAIL,
      name: 'Admin',
      passwordHash,
      role: Role.ADMIN,
    },
  });
}
