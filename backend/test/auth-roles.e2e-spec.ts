import {
  Controller,
  Get,
  INestApplication,
  Module,
  ValidationPipe,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import * as argon2 from 'argon2';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { Public } from '../src/auth/decorators/public.decorator';
import { Roles } from '../src/auth/decorators/roles.decorator';
import { PrismaService } from '../src/prisma/prisma.service';

@Controller('test-auth')
class TestAuthController {
  @Public()
  @Get('public')
  pub() {
    return 'ok';
  }

  @Get('private')
  priv() {
    return 'ok';
  }

  @Roles(Role.ADMIN)
  @Get('admin')
  admin() {
    return 'ok';
  }
}

@Module({ controllers: [TestAuthController] })
class TestAuthModule {}

describe('Protección de endpoints y roles (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const testUser = {
    email: 'e2e-roles@futbolaltoque.com',
    name: 'E2E Roles User',
    password: 'password1234',
    role: Role.PLAYER,
  };

  let userId: string;
  let playerToken: string;
  let adminToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, TestAuthModule],
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
    const user = await prisma.user.create({
      data: {
        email: testUser.email,
        name: testUser.name,
        role: testUser.role,
        passwordHash: await argon2.hash(testUser.password),
      },
    });
    userId = user.id;

    playerToken = await jwtService.signAsync({
      sub: userId,
      email: testUser.email,
      role: Role.PLAYER,
    });
    adminToken = await jwtService.signAsync({
      sub: userId,
      email: testUser.email,
      role: Role.ADMIN,
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await app.close();
  });

  describe('matriz de decisión', () => {
    it('sin decorador + sin token → 401', () =>
      request(app.getHttpServer()).get('/test-auth/private').expect(401));

    it('sin decorador + PLAYER → 200', () =>
      request(app.getHttpServer())
        .get('/test-auth/private')
        .set('Authorization', `Bearer ${playerToken}`)
        .expect(200));

    it('sin decorador + ADMIN → 200', () =>
      request(app.getHttpServer())
        .get('/test-auth/private')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200));

    it('@Public() + sin token → 200', () =>
      request(app.getHttpServer()).get('/test-auth/public').expect(200));

    it('@Public() + PLAYER → 200', () =>
      request(app.getHttpServer())
        .get('/test-auth/public')
        .set('Authorization', `Bearer ${playerToken}`)
        .expect(200));

    it('@Public() + ADMIN → 200', () =>
      request(app.getHttpServer())
        .get('/test-auth/public')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200));

    it('@Roles(ADMIN) + sin token → 401', () =>
      request(app.getHttpServer()).get('/test-auth/admin').expect(401));

    it('@Roles(ADMIN) + PLAYER → 403', () =>
      request(app.getHttpServer())
        .get('/test-auth/admin')
        .set('Authorization', `Bearer ${playerToken}`)
        .expect(403));

    it('@Roles(ADMIN) + ADMIN → 200', () =>
      request(app.getHttpServer())
        .get('/test-auth/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200));
  });

  it('token con role fuera del enum devuelve 401', async () => {
    const invalidRoleToken = await jwtService.signAsync({
      sub: userId,
      email: testUser.email,
      role: 'ROOT',
    });

    await request(app.getHttpServer())
      .get('/test-auth/private')
      .set('Authorization', `Bearer ${invalidRoleToken}`)
      .expect(401);
  });

  it('token vencido devuelve 401', async () => {
    const expiredToken = await jwtService.signAsync(
      { sub: userId, email: testUser.email, role: Role.PLAYER },
      { expiresIn: '-1s' },
    );

    await request(app.getHttpServer())
      .get('/test-auth/private')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);
  });

  describe('GET /auth/me', () => {
    it('devuelve el usuario autenticado sin passwordHash', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${playerToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: userId,
        email: testUser.email,
        name: testUser.name,
        role: testUser.role,
      });
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('devuelve 401 si el usuario del token ya no existe', async () => {
      const ghostToken = await jwtService.signAsync({
        sub: '00000000-0000-0000-0000-000000000000',
        email: 'ghost@futbolaltoque.com',
        role: Role.PLAYER,
      });

      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${ghostToken}`)
        .expect(401);
    });
  });
});
