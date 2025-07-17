import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsEmail, IsOptional, IsString, Length, Matches, ValidateNested } from 'class-validator';

export class IntervaloDto {
  @ApiProperty({ example: '12:00' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Formato de hora inválido. Use HH:MM'
  })
  inicio: string;

  @ApiProperty({ example: '13:00' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Formato de hora inválido. Use HH:MM'
  })
  fim: string;
}

class HorarioTrabalhoDto {
  @ApiProperty({ example: '08:00' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Formato de hora inválido. Use HH:MM'
  })
  entrada: string;

  @ApiProperty({ example: '17:00' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Formato de hora inválido. Use HH:MM'
  })
  saida: string;

  @ApiProperty({ type: [IntervaloDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IntervaloDto)
  intervalos: IntervaloDto[];
}

export class CreateFuncionarioDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @Length(2, 255)
  nome: string;

  @ApiProperty({ example: '123.456.789-10' })
  @IsString()
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, {
    message: 'CPF deve estar no formato XXX.XXX.XXX-XX'
  })
  cpf: string;

  @ApiProperty({ example: 'joao.silva@empresa.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '(11) 99999-0001' })
  @IsString()
  @Length(10, 20)
  telefone: string;

  @ApiProperty({ example: 'Desenvolvedor Frontend' })
  @IsString()
  @Length(2, 100)
  cargo: string;

  @ApiProperty({ example: 'Tecnologia' })
  @IsString()
  @Length(2, 100)
  departamento: string;

  @ApiProperty({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @ApiProperty({ example: '2023-01-15' })
  @IsDateString()
  dataAdmissao: string;

  @ApiProperty({ type: HorarioTrabalhoDto })
  @ValidateNested()
  @Type(() => HorarioTrabalhoDto)
  horarioTrabalho: HorarioTrabalhoDto;
} 