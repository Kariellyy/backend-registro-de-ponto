import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { UserRole } from '../../../core/enums/user-role.enum';
import { UserStatus } from '../../../core/enums/user-status.enum';

export class CreateUsuarioDto {
  @IsString({ message: 'Nome deve ser uma string' })
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  nome: string;

  @IsEmail({}, { message: 'Email deve ser um endereço válido' })
  email: string;

  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  password: string;

  @IsOptional()
  @IsString({ message: 'Telefone deve ser uma string' })
  telefone?: string;

  @IsOptional()
  @IsString({ message: 'URL da foto deve ser uma string' })
  photoUrl?: string;

  @IsEnum(UserRole, { message: 'Papel deve ser um valor válido' })
  papel: UserRole;

  @IsOptional()
  @IsEnum(UserStatus, { message: 'Status deve ser um valor válido' })
  status?: UserStatus;

  @IsUUID('4', { message: 'ID da empresa deve ser um UUID válido' })
  empresaId: string;
}
