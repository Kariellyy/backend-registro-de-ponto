import { ApiProperty } from '@nestjs/swagger';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('funcionarios')
export class Funcionario {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ length: 255 })
  nome: string;

  @ApiProperty()
  @Column({ length: 14, unique: true })
  cpf: string;

  @ApiProperty()
  @Column({ length: 255, unique: true })
  email: string;

  @ApiProperty()
  @Column({ length: 20 })
  telefone: string;

  @ApiProperty()
  @Column({ length: 100 })
  cargo: string;

  @ApiProperty()
  @Column({ length: 100 })
  departamento: string;

  @ApiProperty()
  @Column({ default: true })
  ativo: boolean;

  @ApiProperty()
  @Column({ type: 'date' })
  dataAdmissao: Date;

  @ApiProperty()
  @Column('json')
  horarioTrabalho: {
    entrada: string;
    saida: string;
    intervalos: {
      inicio: string;
      fim: string;
    }[];
  };

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
} 