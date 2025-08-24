import {
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class CreateEmpresaDto {
  @IsString({ message: 'Nome deve ser uma string' })
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  nome: string;

  @IsString({ message: 'CNPJ deve ser uma string' })
  @MinLength(14, { message: 'CNPJ deve ter 14 caracteres' })
  cnpj: string;

  @IsEmail({}, { message: 'Email deve ser um endereço válido' })
  email: string;

  @IsOptional()
  @IsString({ message: 'Telefone deve ser uma string' })
  telefone?: string;

  @IsOptional()
  @IsString({ message: 'Endereço deve ser uma string' })
  endereco?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Latitude deve ser um número' })
  latitude?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Longitude deve ser um número' })
  longitude?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Raio permitido deve ser um número' })
  @Min(10, { message: 'Raio permitido deve ser no mínimo 10 metros' })
  @Max(1000, { message: 'Raio permitido deve ser no máximo 1000 metros' })
  raioPermitido?: number;
}
