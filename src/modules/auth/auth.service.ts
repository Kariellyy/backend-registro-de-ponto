import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../../core/enums/user-role.enum';
import { UserStatus } from '../../core/enums/user-status.enum';
import { EmpresasService } from '../empresas/services/empresas.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { RegisterDto } from './dto/login.dto';
import {
  AuthResponse,
  JwtPayload,
  MeResponse,
  RegisterResponse,
} from './interfaces/auth.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly jwtService: JwtService,
    private readonly empresasService: EmpresasService,
  ) {}

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      this.logger.debug(`Tentativa de login para: ${email}`);

      const user = await this.usuariosService.findByEmailWithPassword(email);

      const isPasswordValid = await this.usuariosService.validatePassword(
        password,
        user.password,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('Credenciais inválidas');
      }

      this.logger.debug(`Login bem-sucedido para: ${email}`);

      const empresa = await this.empresasService.findOne(user.empresaId);

      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        papel: user.papel,
        empresaId: user.empresaId,
      };

      const access_token = this.jwtService.sign(payload);

      const { password: _, ...userWithoutPassword } = user;

      return {
        access_token,
        user: userWithoutPassword,
        empresa,
      };
    } catch (error) {
      this.logger.error(`Erro no login: ${error.message}`);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Credenciais inválidas');
    }
  }

  async register(registerDto: RegisterDto): Promise<RegisterResponse> {
    try {
      this.logger.debug(`Registrando novo usuário: ${registerDto.email}`);

      // Criar empresa primeiro
      const empresaData = {
        nome: registerDto.nomeEmpresa,
        cnpj: registerDto.cnpj,
        email: registerDto.emailEmpresa,
      };

      const empresa = await this.empresasService.create(empresaData);

      // Criar usuário como dono da empresa
      const userData = {
        nome: registerDto.nome,
        email: registerDto.email,
        password: registerDto.password,
        papel: UserRole.DONO,
        status: UserStatus.ATIVO,
        empresaId: empresa.id,
      };

      const user = await this.usuariosService.create(userData);

      this.logger.debug(`Usuário registrado com sucesso: ${user.email}`);

      const { password: _, ...userWithoutPassword } = user;

      return {
        message: 'Usuário e empresa criados com sucesso',
        user: userWithoutPassword,
        empresa,
      };
    } catch (error) {
      this.logger.error(`Erro no registro: ${error.message}`);
      throw error;
    }
  }

  async getMe(userId: string): Promise<MeResponse> {
    const user = await this.usuariosService.findOne(userId);
    const empresa = await this.empresasService.findOne(user.empresaId);

    return {
      user,
      empresa,
    };
  }

  async validateUser(userId: string) {
    try {
      return await this.usuariosService.findOne(userId);
    } catch (error) {
      throw new UnauthorizedException('Usuário não encontrado');
    }
  }
}
