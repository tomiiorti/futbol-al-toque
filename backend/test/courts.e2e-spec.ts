import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import * as argon2 from 'argon2';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('CourtsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const adminA = {
    email: 'e2e-courts-admin-a@futbolaltoque.com',
    name: 'E2E Courts Admin A',
  };
  const adminB = {
    email: 'e2e-courts-admin-b@futbolaltoque.com',
    name: 'E2E Courts Admin B',
  };
  const player = {
    email: 'e2e-courts-player@futbolaltoque.com',
    name: 'E2E Courts Player',
  };

  const testEmails = [adminA.email, adminB.email, player.email];

  let adminAId: string;
  let adminBId: string;
  let adminAToken: string;
  let adminBToken: string;
  let playerToken: string;

  let venueA: string;
  let venueB: string;

  const nonExistentId = '00000000-0000-0000-0000-000000000000';

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

    await prisma.user.deleteMany({ where: { email: { in: testEmails } } });
    const passwordHash = await argon2.hash('password1234');

    const createdAdminA = await prisma.user.create({
      data: { ...adminA, role: Role.ADMIN, passwordHash },
    });
    adminAId = createdAdminA.id;

    const createdAdminB = await prisma.user.create({
      data: { ...adminB, role: Role.ADMIN, passwordHash },
    });
    adminBId = createdAdminB.id;

    const createdPlayer = await prisma.user.create({
      data: { ...player, role: Role.PLAYER, passwordHash },
    });

    adminAToken = await jwtService.signAsync({
      sub: adminAId,
      email: adminA.email,
      role: Role.ADMIN,
    });
    adminBToken = await jwtService.signAsync({
      sub: adminBId,
      email: adminB.email,
      role: Role.ADMIN,
    });
    playerToken = await jwtService.signAsync({
      sub: createdPlayer.id,
      email: player.email,
      role: Role.PLAYER,
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: testEmails } } });
    await app.close();
  });

  beforeEach(async () => {
    const createdVenueA = await prisma.venue.create({
      data: { name: 'Venue A', address: 'Av. Siempre Viva 123', ownerId: adminAId },
    });
    venueA = createdVenueA.id;

    const createdVenueB = await prisma.venue.create({
      data: { name: 'Venue B', address: 'Av. Siempre Viva 456', ownerId: adminBId },
    });
    venueB = createdVenueB.id;
  });

  afterEach(async () => {
    await prisma.venue.deleteMany({
      where: { ownerId: { in: [adminAId, adminBId] } },
    });
  });

  const createCourt = (
    venueId: string,
    token: string,
    overrides: Partial<Record<'name' | 'type' | 'surface', string>> = {},
  ) =>
    request(app.getHttpServer())
      .post(`/venues/${venueId}/courts`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Cancha 1', type: 'F5', surface: 'sintético', ...overrides });

  describe('protección por rol', () => {
    it('POST /venues/:venueId/courts sin token devuelve 401', () =>
      request(app.getHttpServer())
        .post(`/venues/${venueA}/courts`)
        .send({ name: 'Cancha 1', type: 'F5' })
        .expect(401));

    it('POST /venues/:venueId/courts con PLAYER devuelve 403', () =>
      createCourt(venueA, playerToken).expect(403));

    it('GET /venues/:venueId/courts sin token devuelve 401', () =>
      request(app.getHttpServer())
        .get(`/venues/${venueA}/courts`)
        .expect(401));
  });

  describe('ownership del venue', () => {
    it('venueId inexistente devuelve 404 en POST/GET/PATCH/DELETE', async () => {
      await createCourt(nonExistentId, adminAToken).expect(404);

      await request(app.getHttpServer())
        .get(`/venues/${nonExistentId}/courts`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(404);

      await request(app.getHttpServer())
        .patch(`/venues/${nonExistentId}/courts/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ name: 'Otro nombre' })
        .expect(404);

      await request(app.getHttpServer())
        .delete(`/venues/${nonExistentId}/courts/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(404);
    });

    it('venue ajeno devuelve 403 en POST/GET/PATCH/DELETE', async () => {
      const created = await createCourt(venueA, adminAToken).expect(201);
      const courtId = created.body.id as string;

      await createCourt(venueA, adminBToken).expect(403);

      await request(app.getHttpServer())
        .get(`/venues/${venueA}/courts`)
        .set('Authorization', `Bearer ${adminBToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .get(`/venues/${venueA}/courts/${courtId}`)
        .set('Authorization', `Bearer ${adminBToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .patch(`/venues/${venueA}/courts/${courtId}`)
        .set('Authorization', `Bearer ${adminBToken}`)
        .send({ name: 'Intento ajeno' })
        .expect(403);

      await request(app.getHttpServer())
        .delete(`/venues/${venueA}/courts/${courtId}`)
        .set('Authorization', `Bearer ${adminBToken}`)
        .expect(403);
    });
  });

  describe('POST /venues/:venueId/courts', () => {
    it('ADMIN crea una cancha con active true por defecto', async () => {
      const response = await createCourt(venueA, adminAToken).expect(201);

      expect(response.body).toMatchObject({
        venueId: venueA,
        name: 'Cancha 1',
        type: 'F5',
        surface: 'sintético',
        active: true,
      });
      expect(response.body.id).toEqual(expect.any(String));
    });

    it('type fuera del enum devuelve 400 y no crea la cancha', async () => {
      await createCourt(venueA, adminAToken, { type: 'F9' }).expect(400);

      const courts = await prisma.court.findMany({ where: { venueId: venueA } });
      expect(courts).toHaveLength(0);
    });

    it('name inválido devuelve 400 y no crea la cancha', () =>
      createCourt(venueA, adminAToken, { name: 'C' }).expect(400));
  });

  describe('GET /venues/:venueId/courts', () => {
    it('devuelve solo las canchas del venue indicado', async () => {
      await createCourt(venueA, adminAToken, { name: 'Cancha A1' }).expect(201);
      await createCourt(venueA, adminAToken, { name: 'Cancha A2' }).expect(201);
      await createCourt(venueB, adminBToken, { name: 'Cancha B1' }).expect(201);

      const response = await request(app.getHttpServer())
        .get(`/venues/${venueA}/courts`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(
        (response.body as Array<{ name: string }>).map((c) => c.name).sort(),
      ).toEqual(['Cancha A1', 'Cancha A2']);
    });
  });

  describe('GET/PATCH/DELETE /venues/:venueId/courts/:id', () => {
    it('id inexistente devuelve 404', async () => {
      await request(app.getHttpServer())
        .get(`/venues/${venueA}/courts/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(404);

      await request(app.getHttpServer())
        .patch(`/venues/${venueA}/courts/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ name: 'Otro nombre' })
        .expect(404);

      await request(app.getHttpServer())
        .delete(`/venues/${venueA}/courts/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(404);
    });

    it('cancha de otro venue devuelve 404', async () => {
      const created = await createCourt(venueB, adminBToken).expect(201);
      const courtId = created.body.id as string;

      await request(app.getHttpServer())
        .get(`/venues/${venueA}/courts/${courtId}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(404);

      await request(app.getHttpServer())
        .patch(`/venues/${venueA}/courts/${courtId}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ name: 'Otro nombre' })
        .expect(404);

      await request(app.getHttpServer())
        .delete(`/venues/${venueA}/courts/${courtId}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(404);
    });

    it('PATCH del owner actualiza solo los campos enviados', async () => {
      const created = await createCourt(venueA, adminAToken).expect(201);
      const courtId = created.body.id as string;

      const response = await request(app.getHttpServer())
        .patch(`/venues/${venueA}/courts/${courtId}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ active: false })
        .expect(200);

      expect(response.body).toMatchObject({
        id: courtId,
        venueId: venueA,
        name: 'Cancha 1',
        type: 'F5',
        active: false,
      });
    });

    it('DELETE del owner elimina la cancha y sus schedules en cascada', async () => {
      const created = await createCourt(venueA, adminAToken).expect(201);
      const courtId = created.body.id as string;

      const schedule = await prisma.schedule.create({
        data: {
          courtId,
          dayOfWeek: 1,
          startTime: '18:00',
          endTime: '19:00',
          price: 5000,
        },
      });

      await request(app.getHttpServer())
        .delete(`/venues/${venueA}/courts/${courtId}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(204);

      expect(await prisma.court.findUnique({ where: { id: courtId } })).toBeNull();
      expect(
        await prisma.schedule.findUnique({ where: { id: schedule.id } }),
      ).toBeNull();
    });
  });
});
