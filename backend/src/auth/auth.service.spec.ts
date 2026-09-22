import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { Prisma, Role } from '@prisma/client';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: { user: { findUnique: jest.Mock; create: jest.Mock } };
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
    prisma = { user: { findUnique: jest.fn(), create: jest.fn() } };

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

  describe('register', () => {
    const registerDto = {
      name: 'Juana Pérez',
      email: 'juana@futbolaltoque.com',
      password: 'password1234',
    };

    it('crea el usuario con role PLAYER y devuelve los datos sin passwordHash', async () => {
      const createdUser = {
        id: 'b1c2d3e4-1234-4a2b-8c3d-0000000000bb',
        name: registerDto.name,
        email: registerDto.email,
        role: Role.PLAYER,
        passwordHash: 'hash-irrelevante',
        createdAt: new Date(),
      };
      prisma.user.create.mockResolvedValue(createdUser);

      const result = await authService.register(registerDto);

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: registerDto.name,
            email: registerDto.email,
            role: Role.PLAYER,
          }),
        }),
      );
      expect(result).toEqual({
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
        createdAt: createdUser.createdAt,
      });
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('lanza ConflictException cuando el email ya está registrado', async () => {
      prisma.user.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '5.19.0',
        }),
      );

      await expect(authService.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
