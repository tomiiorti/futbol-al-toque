import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class RegisterResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: Role })
  role!: Role;

  @ApiProperty()
  createdAt!: Date;
}
