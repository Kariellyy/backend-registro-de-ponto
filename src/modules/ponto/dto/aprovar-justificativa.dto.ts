import { IsEnum, IsOptional, IsString } from 'class-validator';
import { StatusJustificativa } from '../entities/justificativa.entity';

export class AprovarJustificativaDto {
  @IsEnum(StatusJustificativa)
  status: StatusJustificativa.APROVADA | StatusJustificativa.REJEITADA;

  @IsOptional()
  @IsString()
  observacoes?: string;
}
