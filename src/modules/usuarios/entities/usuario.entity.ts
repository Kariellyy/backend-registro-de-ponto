import { RegistroPonto } from 'src/modules/ponto/entities/registro-ponto.entity';
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
import { UserRole } from '../../../core/enums/user-role.enum';
import { UserStatus } from '../../../core/enums/user-status.enum';
import { Departamento } from '../../empresas/entities/departamento.entity';
import { Empresa } from '../../empresas/entities/empresa.entity';
import { HorarioFuncionario } from './horario-funcionario.entity';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  nome: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefone: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  photoUrl: string;

  @Column({ type: 'varchar', length: 14, nullable: true })
  cpf: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  cargo: string;

  @Column({ name: 'departamento_id', type: 'uuid', nullable: true })
  departamentoId: string;

  @Column({ type: 'date', nullable: true })
  dataAdmissao: Date;

  // Data a partir da qual os registros de ponto passam a ser considerados
  @Column({ name: 'inicio_registros', type: 'date', nullable: true })
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

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.FUNCIONARIO,
  })
  papel: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ATIVO,
  })
  status: UserStatus;

  @Column({ name: 'empresa_id', type: 'uuid' })
  empresaId: string;

  @ManyToOne(() => Empresa, (empresa) => empresa.usuarios, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @ManyToOne(() => Departamento, (departamento) => departamento.usuarios, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'departamento_id' })
  departamento: Departamento;

  @OneToMany(() => RegistroPonto, (registro) => registro.usuario)
  registrosPonto: RegistroPonto[];

  @OneToMany(() => HorarioFuncionario, (horario) => horario.usuario)
  horarios: HorarioFuncionario[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
