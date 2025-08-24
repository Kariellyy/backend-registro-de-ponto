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

  @IsOptional()
  @IsNumber({}, { message: 'Latitude deve ser um número' })
  latitude?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Longitude deve ser um número' })
  longitude?: number;

  @IsOptional()
  @IsString({ message: 'Endereço deve ser uma string' })
  endereco?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Precisão deve ser um número' })
  precisao?: number;

  @IsOptional()
  @IsBoolean({ message: 'Dentro do raio deve ser um booleano' })
  dentroDoRaio?: boolean;

  @IsOptional()
  @IsString({ message: 'User agent deve ser uma string' })
  userAgent?: string;

  @IsOptional()
  @IsString({ message: 'IP deve ser uma string' })
  ipAddress?: string;

  @IsOptional()
  @IsString({ message: 'Observações deve ser uma string' })
  observacoes?: string;
}
