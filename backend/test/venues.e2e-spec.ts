import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import * as argon2 from 'argon2';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('VenuesController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  const adminA = {
    email: 'e2e-venues-admin-a@futbolaltoque.com',
    name: 'E2E Venues Admin A',
  };
  const adminB = {
    email: 'e2e-venues-admin-b@futbolaltoque.com',
    name: 'E2E Venues Admin B',
  };
  const player = {
    email: 'e2e-venues-player@futbolaltoque.com',
    name: 'E2E Venues Player',
  };

  const testEmails = [adminA.email, adminB.email, player.email];

  let adminAId: string;
  let adminBId: string;
  let adminAToken: string;
  let adminBToken: string;
  let playerToken: string;

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

  afterEach(async () => {
    await prisma.venue.deleteMany({
      where: { ownerId: { in: [adminAId, adminBId] } },
    });
  });

  const createVenue = (token: string, overrides: Partial<Record<'name' | 'address', string>> = {}) =>
    request(app.getHttpServer())
      .post('/venues')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Complejo Norte', address: 'Av. Siempre Viva 123', ...overrides });

  describe('protección por rol', () => {
    it('POST /venues sin token devuelve 401', () =>
      request(app.getHttpServer())
        .post('/venues')
        .send({ name: 'Complejo Norte', address: 'Av. Siempre Viva 123' })
        .expect(401));

    it('POST /venues con PLAYER devuelve 403', () =>
      createVenue(playerToken).expect(403));

    it('GET /venues sin token devuelve 401', () =>
      request(app.getHttpServer()).get('/venues').expect(401));
  });

  describe('POST /venues', () => {
    it('ADMIN crea un venue con ownerId propio', async () => {
      const response = await createVenue(adminAToken).expect(201);

      expect(response.body).toMatchObject({
        name: 'Complejo Norte',
        address: 'Av. Siempre Viva 123',
        ownerId: adminAId,
      });
      expect(response.body.id).toEqual(expect.any(String));
    });

    it('name vacío devuelve 400 y no crea el venue', async () => {
      await createVenue(adminAToken, { name: '' }).expect(400);

      const venues = await prisma.venue.findMany({
        where: { ownerId: adminAId },
      });
      expect(venues).toHaveLength(0);
    });

    it('address de menos de 5 caracteres devuelve 400', () =>
      createVenue(adminAToken, { address: 'abc' }).expect(400));
  });

  describe('GET /venues', () => {
    it('devuelve solo los venues del owner autenticado', async () => {
      await createVenue(adminAToken, { name: 'Venue A1' }).expect(201);
      await createVenue(adminAToken, { name: 'Venue A2' }).expect(201);
      await createVenue(adminBToken, { name: 'Venue B1' }).expect(201);

      const response = await request(app.getHttpServer())
        .get('/venues')
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(
        (response.body as Array<{ name: string }>).map((v) => v.name).sort(),
      ).toEqual(['Venue A1', 'Venue A2']);
    });
  });

  describe('GET/PATCH/DELETE /venues/:id', () => {
    it('id inexistente devuelve 404', async () => {
      await request(app.getHttpServer())
        .get(`/venues/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(404);

      await request(app.getHttpServer())
        .patch(`/venues/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ name: 'Otro nombre' })
        .expect(404);

      await request(app.getHttpServer())
        .delete(`/venues/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(404);
    });

    it('venue ajeno devuelve 403 en GET, PATCH y DELETE', async () => {
      const created = await createVenue(adminAToken).expect(201);
      const venueId = created.body.id as string;

      await request(app.getHttpServer())
        .get(`/venues/${venueId}`)
        .set('Authorization', `Bearer ${adminBToken}`)
        .expect(403);

      await request(app.getHttpServer())
        .patch(`/venues/${venueId}`)
        .set('Authorization', `Bearer ${adminBToken}`)
        .send({ name: 'Intento ajeno' })
        .expect(403);

      await request(app.getHttpServer())
        .delete(`/venues/${venueId}`)
        .set('Authorization', `Bearer ${adminBToken}`)
        .expect(403);
    });

    it('PATCH del owner actualiza solo name/address', async () => {
      const created = await createVenue(adminAToken).expect(201);
      const venueId = created.body.id as string;

      const response = await request(app.getHttpServer())
        .patch(`/venues/${venueId}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .send({ name: 'Nuevo nombre' })
        .expect(200);

      expect(response.body).toMatchObject({
        id: venueId,
        name: 'Nuevo nombre',
        address: 'Av. Siempre Viva 123',
        ownerId: adminAId,
      });
    });

    it('DELETE del owner elimina el venue y sus canchas en cascada', async () => {
      const created = await createVenue(adminAToken).expect(201);
      const venueId = created.body.id as string;

      const court = await prisma.court.create({
        data: { venueId, name: 'Cancha 1', type: 'F5' },
      });

      await request(app.getHttpServer())
        .delete(`/venues/${venueId}`)
        .set('Authorization', `Bearer ${adminAToken}`)
        .expect(204);

      expect(await prisma.venue.findUnique({ where: { id: venueId } })).toBeNull();
      expect(
        await prisma.court.findUnique({ where: { id: court.id } }),
      ).toBeNull();
    });
  });
});
