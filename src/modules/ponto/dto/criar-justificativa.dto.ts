import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TipoJustificativa } from '../entities/justificativa.entity';

export class CriarJustificativaDto {
  @IsNotEmpty()
  @IsString()
  motivo: string;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsNotEmpty()
  @IsEnum(TipoJustificativa)
  tipo: TipoJustificativa;
}
