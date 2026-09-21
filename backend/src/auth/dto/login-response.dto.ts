import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({
    description: 'JWT firmado con userId (sub) y role del usuario',
  })
  accessToken!: string;
}
