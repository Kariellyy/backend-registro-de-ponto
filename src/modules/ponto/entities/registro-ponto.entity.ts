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

export enum TipoRegistro {
  ENTRADA = 'entrada',
  SAIDA = 'saida',
  INTERVALO_INICIO = 'intervalo_inicio',
  INTERVALO_FIM = 'intervalo_fim',
}

export enum StatusRegistro {
  APROVADO = 'aprovado',
  PENDENTE = 'pendente',
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
    name: 'endereco',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  endereco: string;

  @Column({
    name: 'precisao',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    comment: 'Precisão do GPS em metros',
  })
  precisao: number;

  @Column({
    name: 'dentro_do_raio',
    type: 'boolean',
    default: true,
  })
  dentroDoRaio: boolean;

  // Campos de dispositivo
  @Column({
    name: 'user_agent',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  userAgent: string;

  @Column({
    name: 'ip_address',
    type: 'varchar',
    length: 45,
    nullable: true,
  })
  ipAddress: string;

  // Campos de validação
  @Column({
    name: 'observacoes',
    type: 'text',
    nullable: true,
  })
  observacoes: string;

  @Column({
    name: 'aprovado_por',
    type: 'uuid',
    nullable: true,
  })
  aprovadoPor: string;

  @Column({
    name: 'data_aprovacao',
    type: 'timestamp',
    nullable: true,
  })
  dataAprovacao: Date;

  // Relacionamentos
  @ManyToOne(() => Usuario, (usuario) => usuario.registrosPonto, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
