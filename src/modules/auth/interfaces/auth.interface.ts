import { Empresa } from '../../empresas/entities/empresa.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  papel: string;
  empresaId: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  access_token: string;
  user: Omit<Usuario, 'password'>;
  empresa: Empresa;
}

export interface RegisterResponse {
  message: string;
  user: Omit<Usuario, 'password'>;
  empresa: Empresa;
}

export interface MeResponse {
  user: Omit<Usuario, 'password'>;
  empresa: Empresa;
}
