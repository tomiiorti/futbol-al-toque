import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Env } from '../../config/env.validation';
import { AuthUser, normalizeJwtPayload } from '../types/auth-user';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService<Env, true>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET', { infer: true }),
    });
  }

  // Solo se llama si la firma y el exp son válidos. No consulta la DB.
  validate(payload: unknown): AuthUser {
    const user = normalizeJwtPayload(payload);
    if (!user) throw new UnauthorizedException();
    return user; // → req.user
  }
}
