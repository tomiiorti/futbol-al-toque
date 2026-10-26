import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VenuesService } from '../venues/venues.service';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';

const COURT_SELECT = {
  id: true,
  venueId: true,
  name: true,
  type: true,
  surface: true,
  active: true,
} as const;

@Injectable()
export class CourtsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly venuesService: VenuesService,
  ) {}

  async create(venueId: string, ownerId: string, dto: CreateCourtDto) {
    await this.venuesService.findOneOwned(venueId, ownerId);

    return this.prisma.court.create({
      data: {
        venueId,
        name: dto.name,
        type: dto.type,
        surface: dto.surface,
        active: dto.active ?? true,
      },
      select: COURT_SELECT,
    });
  }

  async findAllOwned(venueId: string, ownerId: string) {
    await this.venuesService.findOneOwned(venueId, ownerId);

    return this.prisma.court.findMany({
      where: { venueId },
      select: COURT_SELECT,
    });
  }

  async findOneOwned(id: string, venueId: string, ownerId: string) {
    await this.venuesService.findOneOwned(venueId, ownerId);

    const court = await this.prisma.court.findUnique({
      where: { id },
      select: COURT_SELECT,
    });

    if (!court || court.venueId !== venueId) {
      throw new NotFoundException('Court no encontrada');
    }

    return court;
  }

  async update(
    id: string,
    venueId: string,
    ownerId: string,
    dto: UpdateCourtDto,
  ) {
    await this.findOneOwned(id, venueId, ownerId);

    return this.prisma.court.update({
      where: { id },
      data: {
        name: dto.name,
        type: dto.type,
        surface: dto.surface,
        active: dto.active,
      },
      select: COURT_SELECT,
    });
  }

  async remove(id: string, venueId: string, ownerId: string): Promise<void> {
    await this.findOneOwned(id, venueId, ownerId);
    await this.prisma.court.delete({ where: { id } });
  }
}
