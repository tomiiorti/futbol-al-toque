import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RolesGuard } from './roles.guard';

const ctx = (user?: { role: Role }) =>
  ({
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  }) as unknown as ExecutionContext;

describe('RolesGuard', () => {
  let reflector: Reflector;
  let guard: RolesGuard;
  const meta = (m: Record<string, unknown>) =>
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementation((key) => m[key as string]);

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('pasa si no hay @Roles', () => {
    meta({});
    expect(guard.canActivate(ctx({ role: Role.PLAYER }))).toBe(true);
  });

  it('pasa si es @Public', () => {
    meta({ [IS_PUBLIC_KEY]: true, [ROLES_KEY]: [Role.ADMIN] });
    expect(guard.canActivate(ctx())).toBe(true);
  });

  it('pasa si el rol coincide', () => {
    meta({ [ROLES_KEY]: [Role.ADMIN] });
    expect(guard.canActivate(ctx({ role: Role.ADMIN }))).toBe(true);
  });

  it('403 si el rol no coincide', () => {
    meta({ [ROLES_KEY]: [Role.ADMIN] });
    expect(() => guard.canActivate(ctx({ role: Role.PLAYER }))).toThrow(
      ForbiddenException,
    );
  });

  it('403 si no hay usuario en el request', () => {
    meta({ [ROLES_KEY]: [Role.ADMIN] });
    expect(() => guard.canActivate(ctx(undefined))).toThrow(ForbiddenException);
  });
});
