import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';

export enum TipoFalta {
  FALTA_JUSTIFICADA = 'falta_justificada',
  FALTA_INJUSTIFICADA = 'falta_injustificada',
  ATRASO = 'atraso',
  SAIDA_ANTECIPADA = 'saida_antecipada',
  FALTA_PARCIAL = 'falta_parcial',
}

export enum StatusFalta {
  PENDENTE = 'pendente',
  APROVADA = 'aprovada',
  REJEITADA = 'rejeitada',
}

@Entity('faltas')
export class Falta {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId: string;

  @Column({ name: 'data', type: 'date' })
  data: Date;

  @Column({
    name: 'tipo',
    type: 'enum',
    enum: TipoFalta,
  })
  tipo: TipoFalta;

  @Column({
    name: 'status',
    type: 'enum',
    enum: StatusFalta,
    default: StatusFalta.PENDENTE,
  })
  status: StatusFalta;

  @Column({ type: 'text', nullable: true })
  motivo: string | null;

  @Column({ type: 'text', nullable: true })
  observacoes: string | null;

  // Para faltas parciais (ex: só trabalhou a tarde)
  @Column({ name: 'horario_inicio_efetivo', type: 'time', nullable: true })
  horarioInicioEfetivo: string | null;

  @Column({ name: 'horario_fim_efetivo', type: 'time', nullable: true })
  horarioFimEfetivo: string | null;

  // Para atrasos
  @Column({ name: 'minutos_atraso', type: 'int', nullable: true })
  minutosAtraso: number | null;

  // Para saídas antecipadas
  @Column({ name: 'minutos_saida_antecipada', type: 'int', nullable: true })
  minutosSaidaAntecipada: number | null;

  @Column({ name: 'aprovado_por', type: 'uuid', nullable: true })
  aprovadoPor: string | null;

  @Column({ name: 'data_aprovacao', type: 'timestamptz', nullable: true })
  dataAprovacao: Date | null;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'aprovado_por' })
  aprovador: Usuario;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
