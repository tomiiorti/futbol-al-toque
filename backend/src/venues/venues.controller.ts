import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { VenueResponseDto } from './dto/venue-response.dto';
import { VenuesService } from './venues.service';

@ApiTags('venues')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('venues')
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un complejo propio' })
  @ApiResponse({ status: 201, type: VenueResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async create(
    @CurrentUser('id') ownerId: string,
    @Body() dto: CreateVenueDto,
  ): Promise<VenueResponseDto> {
    return this.venuesService.create(ownerId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar los complejos propios' })
  @ApiResponse({ status: 200, type: [VenueResponseDto] })
  async findAll(
    @CurrentUser('id') ownerId: string,
  ): Promise<VenueResponseDto[]> {
    return this.venuesService.findAllOwned(ownerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un complejo propio por id' })
  @ApiResponse({ status: 200, type: VenueResponseDto })
  @ApiResponse({
    status: 403,
    description: 'El complejo no pertenece al usuario',
  })
  @ApiResponse({ status: 404, description: 'Complejo no encontrado' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') ownerId: string,
  ): Promise<VenueResponseDto> {
    return this.venuesService.findOneOwned(id, ownerId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar name/address de un complejo propio' })
  @ApiResponse({ status: 200, type: VenueResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({
    status: 403,
    description: 'El complejo no pertenece al usuario',
  })
  @ApiResponse({ status: 404, description: 'Complejo no encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') ownerId: string,
    @Body() dto: UpdateVenueDto,
  ): Promise<VenueResponseDto> {
    return this.venuesService.update(id, ownerId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un complejo propio (en cascada)' })
  @ApiResponse({ status: 204, description: 'Eliminado' })
  @ApiResponse({
    status: 403,
    description: 'El complejo no pertenece al usuario',
  })
  @ApiResponse({ status: 404, description: 'Complejo no encontrado' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') ownerId: string,
  ): Promise<void> {
    await this.venuesService.remove(id, ownerId);
  }
}
