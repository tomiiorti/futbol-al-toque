import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: { user: { findUnique: jest.Mock } };
  let jwtService: JwtService;

  const user = {
    id: 'a3f4a6b0-1234-4a2b-8c3d-0000000000aa',
    email: 'admin@futbolaltoque.com',
    name: 'Admin',
    role: Role.ADMIN,
    passwordHash: '',
    createdAt: new Date(),
  };

  beforeAll(async () => {
    user.passwordHash = await argon2.hash('admin1234');
  });

  beforeEach(async () => {
    prisma = { user: { findUnique: jest.fn() } };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(() => Promise.resolve('signed-jwt')),
          },
        },
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
    jwtService = moduleRef.get(JwtService);
  });

  it('devuelve un JWT firmado con sub y role cuando las credenciales son válidas', async () => {
    prisma.user.findUnique.mockResolvedValue(user);

    const token = await authService.login(
      'admin@futbolaltoque.com',
      'admin1234',
    );

    expect(token).toBe('signed-jwt');
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: user.id,
      role: user.role,
    });
  });

  it('lanza UnauthorizedException cuando el email no existe', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      authService.login('no-existe@futbolaltoque.com', 'cualquier-password'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('lanza UnauthorizedException con el mismo mensaje cuando la password es incorrecta', async () => {
    prisma.user.findUnique.mockResolvedValue(user);

    let inexistentEmailError: unknown;
    let wrongPasswordError: unknown;

    prisma.user.findUnique.mockResolvedValueOnce(null);
    try {
      await authService.login('no-existe@futbolaltoque.com', 'admin1234');
    } catch (error) {
      inexistentEmailError = error;
    }

    prisma.user.findUnique.mockResolvedValueOnce(user);
    try {
      await authService.login('admin@futbolaltoque.com', 'password-incorrecta');
    } catch (error) {
      wrongPasswordError = error;
    }

    expect(inexistentEmailError).toBeInstanceOf(UnauthorizedException);
    expect(wrongPasswordError).toBeInstanceOf(UnauthorizedException);
    expect((inexistentEmailError as UnauthorizedException).message).toBe(
      (wrongPasswordError as UnauthorizedException).message,
    );
  });
});
