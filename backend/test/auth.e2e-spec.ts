import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import * as argon2 from 'argon2';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtPayload } from '../src/auth/interfaces/jwt-payload.interface';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const testUser = {
    email: 'e2e-login@futbolaltoque.com',
    name: 'E2E Login User',
    password: 'password1234',
    role: Role.PLAYER,
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);

    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await prisma.user.create({
      data: {
        email: testUser.email,
        name: testUser.name,
        role: testUser.role,
        passwordHash: await argon2.hash(testUser.password),
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await app.close();
  });

  it('POST /auth/login con credenciales válidas devuelve 200 y un JWT con sub/role/exp', async () => {
    const beforeLogin = Math.floor(Date.now() / 1000);

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    expect(response.body.accessToken).toEqual(expect.any(String));

    const payload = jwtService.decode(
      response.body.accessToken,
    ) as JwtPayload & {
      exp: number;
      iat: number;
    };
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: testUser.email },
    });

    expect(payload.sub).toBe(user.id);
    expect(payload.role).toBe(user.role);
    // JWT_EXPIRES_IN="1d" en el .env de desarrollo/test
    expect(payload.exp).toBeGreaterThan(beforeLogin + 23 * 60 * 60);
    expect(payload.exp).toBeLessThanOrEqual(beforeLogin + 24 * 60 * 60 + 5);
  });

  it('POST /auth/login con email inexistente devuelve 401 con mensaje genérico', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'no-existe@futbolaltoque.com',
        password: testUser.password,
      })
      .expect(401);

    expect(response.body.message).toBe('Credenciales inválidas');
  });

  it('POST /auth/login con password incorrecta devuelve 401 con el mismo mensaje genérico', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: 'password-incorrecta' })
      .expect(401);

    expect(response.body.message).toBe('Credenciales inválidas');
  });

  it('POST /auth/login con email mal formado devuelve 400', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'no-es-un-email', password: testUser.password })
      .expect(400);
  });

  it('POST /auth/login sin password devuelve 400', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email })
      .expect(400);
  });
});
