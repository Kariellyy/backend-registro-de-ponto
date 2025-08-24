import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { TipoRegistro } from '../entities/registro-ponto.entity';

export class RegistrarPontoDto {
  @IsEnum(TipoRegistro, { message: 'Tipo de registro inválido' })
  tipo: TipoRegistro;

  @IsNumber({}, { message: 'Latitude deve ser um número' })
  latitude: number;

  @IsNumber({}, { message: 'Longitude deve ser um número' })
  longitude: number;

  @IsOptional()
  @IsString({ message: 'Observações deve ser uma string' })
  observacoes?: string;
}
