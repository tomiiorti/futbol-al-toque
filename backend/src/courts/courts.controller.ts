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
import { CourtsService } from './courts.service';
import { CourtResponseDto } from './dto/court-response.dto';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';

@ApiTags('courts')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('venues/:venueId/courts')
export class CourtsController {
  constructor(private readonly courtsService: CourtsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una cancha en un venue propio' })
  @ApiResponse({ status: 201, type: CourtResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({
    status: 403,
    description: 'El venue no pertenece al usuario',
  })
  @ApiResponse({ status: 404, description: 'Venue no encontrado' })
  async create(
    @Param('venueId', ParseUUIDPipe) venueId: string,
    @CurrentUser('id') ownerId: string,
    @Body() dto: CreateCourtDto,
  ): Promise<CourtResponseDto> {
    return this.courtsService.create(venueId, ownerId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar las canchas de un venue propio' })
  @ApiResponse({ status: 200, type: [CourtResponseDto] })
  @ApiResponse({
    status: 403,
    description: 'El venue no pertenece al usuario',
  })
  @ApiResponse({ status: 404, description: 'Venue no encontrado' })
  async findAll(
    @Param('venueId', ParseUUIDPipe) venueId: string,
    @CurrentUser('id') ownerId: string,
  ): Promise<CourtResponseDto[]> {
    return this.courtsService.findAllOwned(venueId, ownerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una cancha de un venue propio por id' })
  @ApiResponse({ status: 200, type: CourtResponseDto })
  @ApiResponse({
    status: 403,
    description: 'El venue no pertenece al usuario',
  })
  @ApiResponse({
    status: 404,
    description: 'Venue o cancha no encontrados',
  })
  async findOne(
    @Param('venueId', ParseUUIDPipe) venueId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') ownerId: string,
  ): Promise<CourtResponseDto> {
    return this.courtsService.findOneOwned(id, venueId, ownerId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar name/type/surface/active de una cancha propia',
  })
  @ApiResponse({ status: 200, type: CourtResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({
    status: 403,
    description: 'El venue no pertenece al usuario',
  })
  @ApiResponse({
    status: 404,
    description: 'Venue o cancha no encontrados',
  })
  async update(
    @Param('venueId', ParseUUIDPipe) venueId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') ownerId: string,
    @Body() dto: UpdateCourtDto,
  ): Promise<CourtResponseDto> {
    return this.courtsService.update(id, venueId, ownerId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una cancha propia (en cascada)' })
  @ApiResponse({ status: 204, description: 'Eliminada' })
  @ApiResponse({
    status: 403,
    description: 'El venue no pertenece al usuario',
  })
  @ApiResponse({
    status: 404,
    description: 'Venue o cancha no encontrados',
  })
  async remove(
    @Param('venueId', ParseUUIDPipe) venueId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') ownerId: string,
  ): Promise<void> {
    await this.courtsService.remove(id, venueId, ownerId);
  }
}
