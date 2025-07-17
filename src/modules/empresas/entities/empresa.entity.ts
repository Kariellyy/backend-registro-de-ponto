import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";



@Entity('empresas')
export class Empresa {
    @PrimaryGeneratedColumn('uuid', { name: 'id' })
    id: string;

    @Column({ name: 'nome', type: 'varchar', length: 255, nullable: false })
    nome: string;

    @Column({ name: 'cnpj', type: 'varchar', length: 14, nullable: false })
    cnpj: string;
}
