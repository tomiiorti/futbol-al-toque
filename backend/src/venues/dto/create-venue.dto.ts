import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateVenueDto {
  @ApiProperty({ example: 'Complejo Norte' })
  @IsString()
  @Length(2, 120)
  name!: string;

  @ApiProperty({ example: 'Av. Siempre Viva 123' })
  @IsString()
  @Length(5, 200)
  address!: string;
}
