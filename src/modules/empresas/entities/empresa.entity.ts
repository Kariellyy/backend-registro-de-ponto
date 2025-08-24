import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Departamento } from './departamento.entity';

@Entity('empresas')
export class Empresa {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'nome', type: 'varchar', length: 255, nullable: false })
  nome: string;

  @Column({
    name: 'cnpj',
    type: 'varchar',
    length: 14,
    nullable: false,
    unique: true,
  })
  cnpj: string;

  @Column({
    name: 'email',
    type: 'varchar',
    length: 255,
    nullable: false,
    unique: true,
  })
  email: string;

  @Column({ name: 'telefone', type: 'varchar', length: 20, nullable: true })
  telefone: string;

  @Column({ name: 'endereco', type: 'text', nullable: true })
  endereco: string;

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
    name: 'raio_permitido',
    type: 'int',
    default: 100,
    comment: 'Raio em metros para validação de presença',
  })
  raioPermitido: number;

  // Configurações de horário
  @Column({
    name: 'horario_inicio_manha',
    type: 'time',
    default: '08:00:00',
    comment: 'Horário de início do expediente da manhã',
  })
  horarioInicioManha: string;

  @Column({
    name: 'horario_fim_manha',
    type: 'time',
    default: '12:00:00',
    comment: 'Horário de fim do expediente da manhã',
  })
  horarioFimManha: string;

  @Column({
    name: 'horario_inicio_tarde',
    type: 'time',
    default: '14:00:00',
    comment: 'Horário de início do expediente da tarde',
  })
  horarioInicioTarde: string;

  @Column({
    name: 'horario_fim_tarde',
    type: 'time',
    default: '18:00:00',
    comment: 'Horário de fim do expediente da tarde',
  })
  horarioFimTarde: string;

  // Configurações de tolerância
  @Column({
    name: 'tolerancia_entrada',
    type: 'int',
    default: 15,
    comment: 'Tolerância em minutos para entrada',
  })
  toleranciaEntrada: number;

  @Column({
    name: 'tolerancia_saida',
    type: 'int',
    default: 15,
    comment: 'Tolerância em minutos para saída',
  })
  toleranciaSaida: number;

  // Configurações de flexibilidade
  @Column({
    name: 'permitir_registro_fora_raio',
    type: 'boolean',
    default: false,
    comment: 'Permite registro de ponto fora do raio da empresa',
  })
  permitirRegistroForaRaio: boolean;

  @Column({
    name: 'exigir_justificativa_fora_raio',
    type: 'boolean',
    default: true,
    comment: 'Exige justificativa para registro fora do raio',
  })
  exigirJustificativaForaRaio: boolean;

  @OneToMany(() => Usuario, (usuario) => usuario.empresa)
  usuarios: Usuario[];

  @OneToMany(() => Departamento, (departamento) => departamento.empresa)
  departamentos: Departamento[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
