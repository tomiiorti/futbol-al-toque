import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { VenuesService } from './venues.service';
import { PrismaService } from '../prisma/prisma.service';

describe('VenuesService', () => {
  let service: VenuesService;
  let prisma: {
    venue: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  const ownerId = 'a3f4a6b0-1234-4a2b-8c3d-0000000000aa';
  const otherOwnerId = 'b3f4a6b0-1234-4a2b-8c3d-0000000000bb';
  const venue = {
    id: 'c3f4a6b0-1234-4a2b-8c3d-0000000000cc',
    name: 'Complejo Norte',
    address: 'Av. Siempre Viva 123',
    ownerId,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      venue: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [VenuesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(VenuesService);
  });

  it('create asigna el ownerId del caller', async () => {
    prisma.venue.create.mockResolvedValue(venue);

    await service.create(ownerId, { name: venue.name, address: venue.address });

    expect(prisma.venue.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { name: venue.name, address: venue.address, ownerId },
      }),
    );
  });

  it('findOneOwned lanza NotFoundException si el venue no existe', async () => {
    prisma.venue.findUnique.mockResolvedValue(null);

    await expect(service.findOneOwned(venue.id, ownerId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('findOneOwned lanza ForbiddenException si el venue es de otro owner', async () => {
    prisma.venue.findUnique.mockResolvedValue(venue);

    await expect(service.findOneOwned(venue.id, otherOwnerId)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('findOneOwned devuelve el venue si pertenece al owner', async () => {
    prisma.venue.findUnique.mockResolvedValue(venue);

    await expect(service.findOneOwned(venue.id, ownerId)).resolves.toEqual(
      venue,
    );
  });

  it('update solo cambia name/address, sin tocar ownerId', async () => {
    prisma.venue.findUnique.mockResolvedValue(venue);
    prisma.venue.update.mockResolvedValue({ ...venue, name: 'Nuevo nombre' });

    await service.update(venue.id, ownerId, { name: 'Nuevo nombre' });

    expect(prisma.venue.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: venue.id },
        data: { name: 'Nuevo nombre', address: undefined },
      }),
    );
  });

  it('update lanza ForbiddenException si el venue es de otro owner', async () => {
    prisma.venue.findUnique.mockResolvedValue(venue);

    await expect(
      service.update(venue.id, otherOwnerId, { name: 'Nuevo nombre' }),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.venue.update).not.toHaveBeenCalled();
  });

  it('remove llama a prisma.venue.delete con el id correcto', async () => {
    prisma.venue.findUnique.mockResolvedValue(venue);

    await service.remove(venue.id, ownerId);

    expect(prisma.venue.delete).toHaveBeenCalledWith({
      where: { id: venue.id },
    });
  });

  it('remove lanza NotFoundException si el venue no existe, sin llamar a delete', async () => {
    prisma.venue.findUnique.mockResolvedValue(null);

    await expect(service.remove(venue.id, ownerId)).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.venue.delete).not.toHaveBeenCalled();
  });
});
