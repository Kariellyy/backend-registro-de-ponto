import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Cargo } from '../../empresas/entities/cargo.entity';
import { Departamento } from '../../empresas/entities/departamento.entity';
import { Usuario } from './usuario.entity';

@Entity('informacoes_trabalhistas')
export class InformacoesTrabalhistas {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'usuario_id', type: 'uuid', unique: true })
  usuarioId: string;

  @OneToOne(() => Usuario, (usuario) => usuario.informacoesTrabalhistas, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ name: 'cargo_id', type: 'uuid' })
  cargoId: string;

  @ManyToOne(() => Cargo, (cargo) => cargo.informacoesTrabalhistas, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cargo_id' })
  cargo: Cargo;

  @Column({ name: 'departamento_id', type: 'uuid' })
  departamentoId: string;

  @ManyToOne(
    () => Departamento,
    (departamento) => departamento.informacoesTrabalhistas,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'departamento_id' })
  departamento: Departamento;

  @Column({ type: 'date' })
  dataAdmissao: Date;

  // Data a partir da qual os registros de ponto passam a ser considerados
  @Column({ name: 'inicio_registros', type: 'date' })
  inicioRegistros: Date;

  @Column({
    name: 'carga_horaria_semanal',
    type: 'decimal',
    precision: 4,
    scale: 2,
    default: 40,
    comment: 'Carga horária semanal contratual (calculada automaticamente)',
  })
  cargaHorariaSemanal: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
