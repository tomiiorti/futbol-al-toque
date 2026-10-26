import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourtType } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreateCourtDto {
  @ApiProperty({ example: 'Cancha 1' })
  @IsString()
  @Length(2, 80)
  name!: string;

  @ApiProperty({ enum: CourtType, example: CourtType.F5 })
  @IsEnum(CourtType)
  type!: CourtType;

  @ApiPropertyOptional({ example: 'sintético' })
  @IsOptional()
  @IsString()
  @Length(2, 80)
  surface?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
