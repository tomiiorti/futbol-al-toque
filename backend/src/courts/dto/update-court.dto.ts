import { ApiPropertyOptional } from '@nestjs/swagger';
import { CourtType } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, Length } from 'class-validator';

export class UpdateCourtDto {
  @ApiPropertyOptional({ example: 'Cancha 1' })
  @IsOptional()
  @IsString()
  @Length(2, 80)
  name?: string;

  @ApiPropertyOptional({ enum: CourtType, example: CourtType.F5 })
  @IsOptional()
  @IsEnum(CourtType)
  type?: CourtType;

  @ApiPropertyOptional({ example: 'sintético' })
  @IsOptional()
  @IsString()
  @Length(2, 80)
  surface?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
