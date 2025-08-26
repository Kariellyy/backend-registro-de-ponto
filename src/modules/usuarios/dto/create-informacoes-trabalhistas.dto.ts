import { IsDateString, IsNumber, IsOptional, IsUUID } from 'class-validator';

export class CreateInformacoesTrabalhistasDto {
  @IsUUID('4', { message: 'ID do cargo deve ser um UUID válido' })
  cargoId: string;

  @IsUUID('4', { message: 'ID do departamento deve ser um UUID válido' })
  departamentoId: string;

  @IsDateString({}, { message: 'Data de admissão deve ser uma data válida' })
  dataAdmissao: string;

  @IsDateString(
    {},
    { message: 'Início dos registros deve ser uma data válida' },
  )
  inicioRegistros: string;

  @IsOptional()
  @IsNumber({}, { message: 'Carga horária semanal deve ser um número' })
  cargaHorariaSemanal?: number;
}
