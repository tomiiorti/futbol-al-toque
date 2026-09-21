import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';

// Hash argon2 fijo (sin password real asociada) usado solo para que la
// verificación tarde lo mismo cuando el email no existe, y así no filtrar
// por timing si un email está registrado o no.
const DUMMY_PASSWORD_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$mZg26zyqrxVUstUhjuoeJQ$Z5ESnCZGUsiuvLTghXr3QmfDufODhLeeMhq/hT8H5FU';

const INVALID_CREDENTIALS_MESSAGE = 'Credenciales inválidas';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      await argon2.verify(DUMMY_PASSWORD_HASH, password);
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const passwordMatches = await argon2.verify(user.passwordHash, password);
    if (!passwordMatches) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const payload: JwtPayload = { sub: user.id, role: user.role };
    return this.jwtService.signAsync(payload);
  }
}
