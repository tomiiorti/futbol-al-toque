import { Role } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

export function normalizeJwtPayload(raw: unknown): AuthUser | null {
  if (typeof raw !== 'object' || raw === null) return null;

  const { sub, email, role } = raw as Record<string, unknown>;
  if (typeof sub !== 'string' || typeof email !== 'string') return null;
  if (!Object.values(Role).includes(role as Role)) return null;

  return { id: sub, email, role: role as Role };
}
