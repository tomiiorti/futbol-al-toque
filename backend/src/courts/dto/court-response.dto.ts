import { ApiProperty } from '@nestjs/swagger';
import { CourtType } from '@prisma/client';

export class CourtResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  venueId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: CourtType })
  type!: CourtType;

  @ApiProperty({ nullable: true })
  surface!: string | null;

  @ApiProperty()
  active!: boolean;
}
