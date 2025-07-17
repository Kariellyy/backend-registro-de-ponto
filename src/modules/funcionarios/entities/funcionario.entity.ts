import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('funcionarios')
export class Funcionario {
  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', description: 'ID único do funcionário' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'João Silva', description: 'Nome completo do funcionário' })
  @Column({ length: 255 })
  nome: string;

  @ApiProperty({ example: '123.456.789-10', description: 'CPF do funcionário' })
  @Column({ length: 14, unique: true })
  cpf: string;

  @ApiProperty({ example: 'joao.silva@empresa.com', description: 'Email do funcionário' })
  @Column({ length: 255, unique: true })
  email: string;

  @ApiProperty({ example: '(11) 99999-0001', description: 'Telefone do funcionário' })
  @Column({ length: 20 })
  telefone: string;

  @ApiProperty({ example: 'Desenvolvedor Frontend', description: 'Cargo do funcionário' })
  @Column({ length: 100 })
  cargo: string;

  @ApiProperty({ example: 'Tecnologia', description: 'Departamento do funcionário' })
  @Column({ length: 100 })
  departamento: string;

  @ApiProperty({ example: true, description: 'Status ativo do funcionário' })
  @Column({ default: true })
  ativo: boolean;

  @ApiProperty({ example: '2023-01-15', description: 'Data de admissão do funcionário' })
  @Column({ type: 'date' })
  dataAdmissao: Date;

  @ApiProperty({
    example: {
      entrada: '08:00',
      saida: '17:00',
      intervalos: [{ inicio: '12:00', fim: '13:00' }]
    },
    description: 'Horário de trabalho do funcionário'
  })
  @Column('json')
  horarioTrabalho: {
    entrada: string;
    saida: string;
    intervalos: {
      inicio: string;
      fim: string;
    }[];
  };

  @ApiProperty({ description: 'Data de criação do registro' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização do registro' })
  @UpdateDateColumn()
  updatedAt: Date;
} 