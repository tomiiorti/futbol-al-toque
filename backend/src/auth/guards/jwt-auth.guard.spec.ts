import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

const ctx = () =>
  ({
    getHandler: () => undefined,
    getClass: () => undefined,
  }) as unknown as ExecutionContext;

describe('JwtAuthGuard', () => {
  let reflector: Reflector;
  let guard: JwtAuthGuard;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  it('deja pasar sin validar el token si el endpoint es @Public', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
    const superCanActivate = jest.spyOn(
      AuthGuard('jwt').prototype,
      'canActivate',
    );

    expect(guard.canActivate(ctx())).toBe(true);
    expect(superCanActivate).not.toHaveBeenCalled();
  });

  it('delega en AuthGuard(jwt) si el endpoint no es público', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const superCanActivate = jest
      .spyOn(AuthGuard('jwt').prototype, 'canActivate')
      .mockReturnValue(true);
    const context = ctx();

    expect(guard.canActivate(context)).toBe(true);
    expect(superCanActivate).toHaveBeenCalledWith(context);
  });

  it('usa IS_PUBLIC_KEY leyendo método y clase', () => {
    const getAllAndOverride = jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(true);
    const context = ctx();

    guard.canActivate(context);

    expect(getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  });
});
