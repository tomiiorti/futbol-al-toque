import { ApiProperty } from '@nestjs/swagger';

export class VenueResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  address!: string;

  @ApiProperty()
  ownerId!: string;

  @ApiProperty()
  createdAt!: Date;
}
