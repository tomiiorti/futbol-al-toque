import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Juana Pérez' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'juana@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password1234' })
  @IsString()
  @MinLength(8)
  password!: string;
}
