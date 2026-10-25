import { PrismaClient, Role } from '@prisma/client';
import { upsertAdminUser } from './upsert-admin-user';

describe('upsertAdminUser', () => {
  const env = {
    ADMIN_EMAIL: 'admin@example.com',
    ADMIN_PASSWORD: 'validpassword123',
  };

  it('hace upsert por email con role ADMIN en create y en update', async () => {
    const upsert = jest.fn().mockResolvedValue(undefined);
    const prisma = { user: { upsert } } as unknown as PrismaClient;

    await upsertAdminUser(prisma, env);

    expect(upsert).toHaveBeenCalledTimes(1);
    const call = upsert.mock.calls[0][0];

    expect(call.where).toEqual({ email: env.ADMIN_EMAIL });
    expect(call.create).toMatchObject({
      email: env.ADMIN_EMAIL,
      role: Role.ADMIN,
    });
    expect(call.update).toMatchObject({ role: Role.ADMIN });
    expect(typeof call.create.passwordHash).toBe('string');
    expect(call.create.passwordHash).not.toBe(env.ADMIN_PASSWORD);
  });
});
