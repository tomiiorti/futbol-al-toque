import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import * as argon2 from 'argon2';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AuthController - register (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const newUserEmail = 'e2e-register-new@futbolaltoque.com';
  const existingUser = {
    email: 'e2e-register-existing@futbolaltoque.com',
    name: 'E2E Register Existing User',
    password: 'password1234',
  };

  const testEmails = [newUserEmail, existingUser.email];

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

    await prisma.user.deleteMany({ where: { email: { in: testEmails } } });
    await prisma.user.create({
      data: {
        email: existingUser.email,
        name: existingUser.name,
        role: Role.PLAYER,
        passwordHash: await argon2.hash(existingUser.password),
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: testEmails } } });
    await app.close();
  });

  it('POST /auth/register con datos válidos devuelve 201 con role PLAYER y sin passwordHash', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'E2E Register New User',
        email: newUserEmail,
        password: 'password1234',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      name: 'E2E Register New User',
      email: newUserEmail,
      role: Role.PLAYER,
    });
    expect(response.body.id).toEqual(expect.any(String));
    expect(response.body).not.toHaveProperty('passwordHash');
    expect(response.body).not.toHaveProperty('password');

    const created = await prisma.user.findUniqueOrThrow({
      where: { email: newUserEmail },
    });
    expect(created.role).toBe(Role.PLAYER);
  });

  it('POST /auth/register con email ya registrado devuelve 409', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Otro Nombre',
        email: existingUser.email,
        password: 'otra-password',
      })
      .expect(409);
  });

  it('POST /auth/register sin name devuelve 400', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'sin-nombre@futbolaltoque.com', password: 'password1234' })
      .expect(400);
  });

  it('POST /auth/register con email mal formado devuelve 400', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Nombre',
        email: 'no-es-un-email',
        password: 'password1234',
      })
      .expect(400);
  });

  it('POST /auth/register con password corta devuelve 400', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Nombre',
        email: 'password-corta@futbolaltoque.com',
        password: 'corta',
      })
      .expect(400);
  });

  it('POST /auth/register con role en el body devuelve 400 y no crea un ADMIN', async () => {
    const email = 'intento-admin@futbolaltoque.com';
    testEmails.push(email);

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Intento Admin',
        email,
        password: 'password1234',
        role: 'ADMIN',
      })
      .expect(400);

    const created = await prisma.user.findUnique({ where: { email } });
    expect(created).toBeNull();
  });
});
