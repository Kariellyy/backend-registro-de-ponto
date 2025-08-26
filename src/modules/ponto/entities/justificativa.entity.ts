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
import { RegistroPonto } from './registro-ponto.entity';

export enum TipoJustificativa {
  FORA_RAIO = 'fora_raio',
  PROBLEMA_TECNICO = 'problema_tecnico',
  REUNIAO_EXTERNA = 'reuniao_externa',
  VIAGEM_SERVICO = 'viagem_servico',
  OUTROS = 'outros',
}

export enum StatusJustificativa {
  PENDENTE = 'pendente',
  APROVADA = 'aprovada',
  REJEITADA = 'rejeitada',
}

@Entity('justificativas')
export class Justificativa {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'registro_ponto_id', type: 'uuid' })
  registroPontoId: string;

  @Column({ type: 'text', nullable: false })
  motivo: string;

  @Column({ type: 'text', nullable: true })
  observacoes: string;

  @Column({
    type: 'enum',
    enum: TipoJustificativa,
    nullable: false,
  })
  tipo: TipoJustificativa;

  @Column({
    type: 'enum',
    enum: StatusJustificativa,
    default: StatusJustificativa.PENDENTE,
  })
  status: StatusJustificativa;

  @Column({ name: 'aprovado_por', type: 'uuid', nullable: true })
  aprovadoPor: string;

  @Column({ name: 'data_aprovacao', type: 'timestamp', nullable: true })
  dataAprovacao: Date;

  @ManyToOne(() => RegistroPonto, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'registro_ponto_id' })
  registroPonto: RegistroPonto;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'aprovado_por' })
  aprovador: Usuario;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
