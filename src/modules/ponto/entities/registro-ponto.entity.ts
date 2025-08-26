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
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Justificativa } from './justificativa.entity';

export enum TipoRegistro {
  ENTRADA = 'entrada',
  SAIDA = 'saida',
  INTERVALO_INICIO = 'intervalo_inicio',
  INTERVALO_FIM = 'intervalo_fim',
}

export enum StatusRegistro {
  APROVADO = 'aprovado',
  PENDENTE = 'pendente',
  JUSTIFICADO = 'justificado',
  REJEITADO = 'rejeitado',
}

@Entity('registros_ponto')
export class RegistroPonto {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'usuario_id', type: 'uuid', nullable: false })
  usuarioId: string;

  @Column({
    name: 'tipo',
    type: 'enum',
    enum: TipoRegistro,
    nullable: false,
  })
  tipo: TipoRegistro;

  @Column({
    name: 'status',
    type: 'enum',
    enum: StatusRegistro,
    default: StatusRegistro.APROVADO,
  })
  status: StatusRegistro;

  @Column({ name: 'data_hora', type: 'timestamp', nullable: false })
  dataHora: Date;

  // Campos de geolocalização
  @Column({
    name: 'latitude',
    type: 'decimal',
    precision: 10,
    scale: 8,
    nullable: true,
  })
  latitude: number;

  @Column({
    name: 'longitude',
    type: 'decimal',
    precision: 11,
    scale: 8,
    nullable: true,
  })
  longitude: number;

  @Column({
    name: 'dentro_do_raio',
    type: 'boolean',
    default: true,
  })
  dentroDoRaio: boolean;

  // Campo opcional para observações/justificativas
  @Column({
    name: 'observacoes',
    type: 'text',
    nullable: true,
  })
  observacoes: string;

  // Campo para indicar se tem justificativa pendente
  @Column({
    name: 'tem_justificativa_pendente',
    type: 'boolean',
    default: false,
  })
  temJustificativaPendente: boolean;

  // Relacionamentos
  @ManyToOne(() => Usuario, (usuario) => usuario.registrosPonto, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @OneToMany(
    () => Justificativa,
    (justificativa) => justificativa.registroPonto,
  )
  justificativas: Justificativa[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
