import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { TipoFalta } from '../entities/falta.entity';

export class RegistrarFaltaDto {
  @IsDateString()
  data: string;

  @IsEnum(TipoFalta)
  tipo: TipoFalta;

  @IsOptional()
  @IsString()
  motivo?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsString()
  horarioInicioEfetivo?: string;

  @IsOptional()
  @IsString()
  horarioFimEfetivo?: string;

  @IsOptional()
  minutosAtraso?: number;

  @IsOptional()
  minutosSaidaAntecipada?: number;
}
