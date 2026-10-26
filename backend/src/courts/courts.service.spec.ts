import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CourtType } from '@prisma/client';
import { CourtsService } from './courts.service';
import { PrismaService } from '../prisma/prisma.service';
import { VenuesService } from '../venues/venues.service';

describe('CourtsService', () => {
  let service: CourtsService;
  let prisma: {
    court: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };
  let venuesService: { findOneOwned: jest.Mock };

  const ownerId = 'a3f4a6b0-1234-4a2b-8c3d-0000000000aa';
  const otherOwnerId = 'b3f4a6b0-1234-4a2b-8c3d-0000000000bb';
  const venueId = 'd3f4a6b0-1234-4a2b-8c3d-0000000000dd';
  const otherVenueId = 'e3f4a6b0-1234-4a2b-8c3d-0000000000ee';
  const court = {
    id: 'c3f4a6b0-1234-4a2b-8c3d-0000000000cc',
    venueId,
    name: 'Cancha 1',
    type: CourtType.F5,
    surface: 'sintético',
    active: true,
  };

  beforeEach(async () => {
    prisma = {
      court: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    venuesService = { findOneOwned: jest.fn().mockResolvedValue(undefined) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        CourtsService,
        { provide: PrismaService, useValue: prisma },
        { provide: VenuesService, useValue: venuesService },
      ],
    }).compile();

    service = moduleRef.get(CourtsService);
  });

  it('create valida el ownership del venue antes de crear la cancha', async () => {
    prisma.court.create.mockResolvedValue(court);

    await service.create(venueId, ownerId, {
      name: court.name,
      type: court.type,
      surface: court.surface,
    });

    expect(venuesService.findOneOwned).toHaveBeenCalledWith(venueId, ownerId);
    expect(prisma.court.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          venueId,
          name: court.name,
          type: court.type,
          surface: court.surface,
          active: true,
        },
      }),
    );
  });

  it('create propaga el error de ownership del venue sin crear la cancha', async () => {
    venuesService.findOneOwned.mockRejectedValue(new ForbiddenException());

    await expect(
      service.create(venueId, otherOwnerId, {
        name: court.name,
        type: court.type,
      }),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.court.create).not.toHaveBeenCalled();
  });

  it('findOneOwned lanza NotFoundException si la cancha no existe', async () => {
    prisma.court.findUnique.mockResolvedValue(null);

    await expect(
      service.findOneOwned(court.id, venueId, ownerId),
    ).rejects.toThrow(NotFoundException);
  });

  it('findOneOwned lanza NotFoundException si la cancha pertenece a otro venue', async () => {
    prisma.court.findUnique.mockResolvedValue({
      ...court,
      venueId: otherVenueId,
    });

    await expect(
      service.findOneOwned(court.id, venueId, ownerId),
    ).rejects.toThrow(NotFoundException);
  });

  it('findOneOwned devuelve la cancha si pertenece al venue indicado', async () => {
    prisma.court.findUnique.mockResolvedValue(court);

    await expect(
      service.findOneOwned(court.id, venueId, ownerId),
    ).resolves.toEqual(court);
  });

  it('update solo cambia name/type/surface/active, sin tocar venueId', async () => {
    prisma.court.findUnique.mockResolvedValue(court);
    prisma.court.update.mockResolvedValue({ ...court, active: false });

    await service.update(court.id, venueId, ownerId, { active: false });

    expect(prisma.court.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: court.id },
        data: {
          name: undefined,
          type: undefined,
          surface: undefined,
          active: false,
        },
      }),
    );
  });

  it('remove llama a prisma.court.delete con el id correcto', async () => {
    prisma.court.findUnique.mockResolvedValue(court);

    await service.remove(court.id, venueId, ownerId);

    expect(prisma.court.delete).toHaveBeenCalledWith({
      where: { id: court.id },
    });
  });

  it('remove lanza NotFoundException si la cancha no existe, sin llamar a delete', async () => {
    prisma.court.findUnique.mockResolvedValue(null);

    await expect(service.remove(court.id, venueId, ownerId)).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.court.delete).not.toHaveBeenCalled();
  });
});
