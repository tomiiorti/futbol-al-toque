import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';

const VENUE_SELECT = {
  id: true,
  name: true,
  address: true,
  ownerId: true,
  createdAt: true,
} as const;

@Injectable()
export class VenuesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateVenueDto) {
    return this.prisma.venue.create({
      data: { name: dto.name, address: dto.address, ownerId },
      select: VENUE_SELECT,
    });
  }

  async findAllOwned(ownerId: string) {
    return this.prisma.venue.findMany({
      where: { ownerId },
      select: VENUE_SELECT,
    });
  }

  async findOneOwned(id: string, ownerId: string) {
    const venue = await this.prisma.venue.findUnique({
      where: { id },
      select: VENUE_SELECT,
    });

    if (!venue) throw new NotFoundException('Venue no encontrado');
    if (venue.ownerId !== ownerId) {
      throw new ForbiddenException('El venue no pertenece al usuario');
    }

    return venue;
  }

  async update(id: string, ownerId: string, dto: UpdateVenueDto) {
    await this.findOneOwned(id, ownerId);

    return this.prisma.venue.update({
      where: { id },
      data: { name: dto.name, address: dto.address },
      select: VENUE_SELECT,
    });
  }

  async remove(id: string, ownerId: string): Promise<void> {
    await this.findOneOwned(id, ownerId);
    await this.prisma.venue.delete({ where: { id } });
  }
}
