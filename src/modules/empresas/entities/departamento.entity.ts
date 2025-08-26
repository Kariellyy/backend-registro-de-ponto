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
import { Cargo } from './cargo.entity';
import { Empresa } from './empresa.entity';

@Entity('departamentos')
export class Departamento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao: string;

  @Column({ name: 'empresa_id', type: 'uuid' })
  empresaId: string;

  @ManyToOne(() => Empresa, (empresa) => empresa.departamentos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @OneToMany(() => InformacoesTrabalhistas, (info) => info.departamento)
  informacoesTrabalhistas: InformacoesTrabalhistas[];

  @OneToMany(() => Cargo, (cargo) => cargo.departamento)
  cargos: Cargo[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
