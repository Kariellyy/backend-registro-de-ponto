import { IsOptional, IsString } from 'class-validator';

export class FiltrosJustificativasDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  tipo?: string;

  @IsOptional()
  @IsString()
  dataInicio?: string;

  @IsOptional()
  @IsString()
  dataFim?: string;

  @IsOptional()
  @IsString()
  usuarioId?: string;
}
