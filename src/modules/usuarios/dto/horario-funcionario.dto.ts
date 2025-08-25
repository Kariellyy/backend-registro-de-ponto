import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateHorarioFuncionarioDto {
  @IsInt({ message: 'Dia da semana deve ser um número inteiro' })
  @Min(0, { message: 'Dia da semana deve ser entre 0 e 6' })
  @Max(6, { message: 'Dia da semana deve ser entre 0 e 6' })
  diaSemana: number;

  @IsBoolean({ message: 'Ativo deve ser um valor booleano' })
  ativo: boolean;

  @IsOptional()
  @IsString({ message: 'Horário de início deve ser uma string' })
  horarioInicio?: string;

  @IsOptional()
  @IsString({ message: 'Horário de fim deve ser uma string' })
  horarioFim?: string;

  @IsBoolean({ message: 'Tem intervalo deve ser um valor booleano' })
  temIntervalo: boolean;

  @IsOptional()
  @IsString({ message: 'Horário de início do intervalo deve ser uma string' })
  intervaloInicio?: string;

  @IsOptional()
  @IsString({ message: 'Horário de fim do intervalo deve ser uma string' })
  intervaloFim?: string;
}

export class UpdateHorarioFuncionarioDto extends CreateHorarioFuncionarioDto {}

export class HorarioFuncionarioResponseDto {
  id: string;
  diaSemana: number;
  ativo: boolean;
  horarioInicio: string;
  horarioFim: string;
  temIntervalo: boolean;
  intervaloInicio: string;
  intervaloFim: string;
  usuarioId: string;
}
