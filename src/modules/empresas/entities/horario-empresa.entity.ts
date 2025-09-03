import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Empresa } from './empresa.entity';

@Entity('horarios_empresa')
export class HorarioEmpresa {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({
    name: 'dia_semana',
    type: 'int',
    comment: 'Dia da semana (0=Domingo, 1=Segunda, ..., 6=Sábado)',
  })
  diaSemana: number;

  @Column({
    name: 'ativo',
    type: 'boolean',
    default: true,
    comment: 'Se o horário está ativo para este dia',
  })
  ativo: boolean;

  @Column({
    name: 'horario_inicio',
    type: 'time',
    nullable: true,
    comment: 'Horário de início do expediente',
  })
  horarioInicio: string | null;

  @Column({
    name: 'horario_fim',
    type: 'time',
    nullable: true,
    comment: 'Horário de fim do expediente',
  })
  horarioFim: string | null;

  @Column({
    name: 'tem_intervalo',
    type: 'boolean',
    default: false,
    comment: 'Se possui intervalo para almoço',
  })
  temIntervalo: boolean;

  @Column({
    name: 'intervalo_inicio',
    type: 'time',
    nullable: true,
    comment: 'Horário de início do intervalo',
  })
  intervaloInicio: string | null;

  @Column({
    name: 'intervalo_fim',
    type: 'time',
    nullable: true,
    comment: 'Horário de fim do intervalo',
  })
  intervaloFim: string | null;

  @Column({ name: 'empresa_id', type: 'uuid' })
  empresaId: string;

  @ManyToOne(() => Empresa, (empresa) => empresa.horarios, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
