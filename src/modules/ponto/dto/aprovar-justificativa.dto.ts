import { IsOptional, IsString } from 'class-validator';

export class AprovarJustificativaDto {
  @IsOptional()
  @IsString()
  observacoes?: string;
}
