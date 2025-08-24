import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { Usuario } from "../../usuarios/entities/usuario.entity";
import { Departamento } from "./departamento.entity";

@Entity('empresas')
export class Empresa {
    @PrimaryGeneratedColumn('uuid', { name: 'id' })
    id: string;

    @Column({ name: 'nome', type: 'varchar', length: 255, nullable: false })
    nome: string;

    @Column({ name: 'cnpj', type: 'varchar', length: 14, nullable: false, unique: true })
    cnpj: string;

    @Column({ name: 'email', type: 'varchar', length: 255, nullable: false, unique: true })
    email: string;

    @Column({ name: 'telefone', type: 'varchar', length: 20, nullable: true })
    telefone: string;

    @Column({ name: 'endereco', type: 'text', nullable: true })
    endereco: string;

    @OneToMany(() => Usuario, (usuario) => usuario.empresa)
    usuarios: Usuario[];

    @OneToMany(() => Departamento, (departamento) => departamento.empresa)
    departamentos: Departamento[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
