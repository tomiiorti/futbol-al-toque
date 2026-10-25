import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';
import { upsertAdminUser } from '../src/admin-seed/upsert-admin-user';

describe('upsertAdminUser (e2e)', () => {
  let prisma: PrismaClient;

  const env = {
    ADMIN_EMAIL: 'e2e-admin-seed@futbolaltoque.com',
    ADMIN_PASSWORD: 'password1234',
  };

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.user.deleteMany({ where: { email: env.ADMIN_EMAIL } });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: env.ADMIN_EMAIL } });
    await prisma.$disconnect();
  });

  it('crea un único User con role ADMIN y no lo duplica en ejecuciones repetidas', async () => {
    await upsertAdminUser(prisma, env);

    const afterFirstRun = await prisma.user.findMany({
      where: { email: env.ADMIN_EMAIL },
    });
    expect(afterFirstRun).toHaveLength(1);
    expect(afterFirstRun[0].role).toBe(Role.ADMIN);
    expect(
      await argon2.verify(afterFirstRun[0].passwordHash, env.ADMIN_PASSWORD),
    ).toBe(true);

    await upsertAdminUser(prisma, env);
    await upsertAdminUser(prisma, env);

    const afterRepeatedRuns = await prisma.user.findMany({
      where: { email: env.ADMIN_EMAIL },
    });
    expect(afterRepeatedRuns).toHaveLength(1);
    expect(afterRepeatedRuns[0].id).toBe(afterFirstRun[0].id);
    expect(afterRepeatedRuns[0].role).toBe(Role.ADMIN);
  });
});
