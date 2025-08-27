import { IsOptional, IsString } from 'class-validator';

export class AprovarFaltaDto {
  @IsOptional()
  @IsString()
  observacoes?: string;
}

export class RejeitarFaltaDto {
  @IsString()
  motivo: string;
}
