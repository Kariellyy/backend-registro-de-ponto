import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email deve ser um endereço válido' })
  email: string;

  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  password: string;
}

export class RegisterDto {
  @IsString({ message: 'Nome deve ser uma string' })
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  nome: string;

  @IsEmail({}, { message: 'Email deve ser um endereço válido' })
  email: string;

  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  password: string;

  @IsString({ message: 'Nome da empresa deve ser uma string' })
  @MinLength(2, { message: 'Nome da empresa deve ter pelo menos 2 caracteres' })
  nomeEmpresa: string;

  @IsString({ message: 'CNPJ deve ser uma string' })
  @MinLength(14, { message: 'CNPJ deve ter 14 caracteres' })
  cnpj: string;

  @IsEmail({}, { message: 'Email da empresa deve ser um endereço válido' })
  emailEmpresa: string;
}
