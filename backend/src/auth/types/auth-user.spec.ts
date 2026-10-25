import { Role } from '@prisma/client';
import { normalizeJwtPayload } from './auth-user';

describe('normalizeJwtPayload', () => {
  const validPayload = {
    sub: 'a3f4a6b0-1234-4a2b-8c3d-0000000000aa',
    email: 'admin@futbolaltoque.com',
    role: Role.ADMIN,
  };

  it('normaliza un payload válido a AuthUser', () => {
    expect(normalizeJwtPayload(validPayload)).toEqual({
      id: validPayload.sub,
      email: validPayload.email,
      role: validPayload.role,
    });
  });

  it('devuelve null si falta sub', () => {
    expect(
      normalizeJwtPayload({
        email: validPayload.email,
        role: validPayload.role,
      }),
    ).toBeNull();
  });

  it('devuelve null si falta email', () => {
    expect(
      normalizeJwtPayload({ sub: validPayload.sub, role: validPayload.role }),
    ).toBeNull();
  });

  it('devuelve null si el role no matchea el enum', () => {
    expect(normalizeJwtPayload({ ...validPayload, role: 'ROOT' })).toBeNull();
  });

  it('devuelve null para null', () => {
    expect(normalizeJwtPayload(null)).toBeNull();
  });

  it('devuelve null para un valor que no es un objeto', () => {
    expect(normalizeJwtPayload('not-an-object')).toBeNull();
  });
});
