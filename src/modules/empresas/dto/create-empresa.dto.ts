import {
  IsBoolean,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
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

  // Configurações de horário
  @IsOptional()
  @IsString({ message: 'Horário de início da manhã deve ser uma string' })
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Horário de início da manhã deve estar no formato HH:MM',
  })
  horarioInicioManha?: string;

  @IsOptional()
  @IsString({ message: 'Horário de fim da manhã deve ser uma string' })
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Horário de fim da manhã deve estar no formato HH:MM',
  })
  horarioFimManha?: string;

  @IsOptional()
  @IsString({ message: 'Horário de início da tarde deve ser uma string' })
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Horário de início da tarde deve estar no formato HH:MM',
  })
  horarioInicioTarde?: string;

  @IsOptional()
  @IsString({ message: 'Horário de fim da tarde deve ser uma string' })
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Horário de fim da tarde deve estar no formato HH:MM',
  })
  horarioFimTarde?: string;

  // Configurações de tolerância
  @IsOptional()
  @IsNumber({}, { message: 'Tolerância de entrada deve ser um número' })
  @Min(0, { message: 'Tolerância de entrada deve ser no mínimo 0 minutos' })
  @Max(60, { message: 'Tolerância de entrada deve ser no máximo 60 minutos' })
  toleranciaEntrada?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Tolerância de saída deve ser um número' })
  @Min(0, { message: 'Tolerância de saída deve ser no mínimo 0 minutos' })
  @Max(60, { message: 'Tolerância de saída deve ser no máximo 60 minutos' })
  toleranciaSaida?: number;

  // Configurações de flexibilidade
  @IsOptional()
  @IsBoolean({ message: 'Permitir registro fora do raio deve ser um booleano' })
  permitirRegistroForaRaio?: boolean;

  @IsOptional()
  @IsBoolean({
    message: 'Exigir justificativa fora do raio deve ser um booleano',
  })
  exigirJustificativaForaRaio?: boolean;
}
