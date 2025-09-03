import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity('horarios_funcionario')
export class HorarioFuncionario {
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

  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @ManyToOne(() => Usuario, (usuario) => usuario.horarios, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
