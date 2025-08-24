import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDepartamentoDto {
  @IsNotEmpty({ message: 'Nome do departamento é obrigatório' })
  @IsString({ message: 'Nome deve ser uma string' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  nome: string;

  @IsOptional()
  @IsString({ message: 'Descrição deve ser uma string' })
  descricao?: string;
}
