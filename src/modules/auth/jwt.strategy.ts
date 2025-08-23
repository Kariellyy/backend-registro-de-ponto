import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { AuthService } from './auth.service';
import { JwtPayload } from './interfaces/auth.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'default-secret-key',
    });
  }

  async validate(payload: JwtPayload): Promise<Usuario> {
    try {
      const user = await this.authService.validateUser(payload.sub);
      return user;
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }
}
