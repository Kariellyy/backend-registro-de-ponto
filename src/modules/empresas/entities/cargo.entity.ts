import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { InformacoesTrabalhistas } from '../../usuarios/entities/informacoes-trabalhistas.entity';
import { Departamento } from './departamento.entity';

@Entity('cargos')
export class Cargo {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ type: 'varchar', length: 150 })
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao?: string;

  @Column({
    name: 'base_salarial',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  baseSalarial: number;

  @Column({ name: 'departamento_id', type: 'uuid' })
  departamentoId: string;

  @ManyToOne(() => Departamento, (departamento) => departamento.cargos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'departamento_id' })
  departamento: Departamento;

  @OneToMany(() => InformacoesTrabalhistas, (info) => info.cargo)
  informacoesTrabalhistas: InformacoesTrabalhistas[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
