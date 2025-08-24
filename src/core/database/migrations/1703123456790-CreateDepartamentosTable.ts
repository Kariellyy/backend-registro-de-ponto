import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDepartamentosTable1703123456790 implements MigrationInterface {
  name = 'CreateDepartamentosTable1703123456790';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "departamentos" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "nome" character varying(100) NOT NULL,
        "descricao" text,
        "empresa_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_departamentos" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "departamentos" 
      ADD CONSTRAINT "FK_departamentos_empresa" 
      FOREIGN KEY ("empresa_id") 
      REFERENCES "empresas"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_departamentos_empresa_nome" 
      ON "departamentos" ("empresa_id", "nome")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_departamentos_empresa_nome"`);
    await queryRunner.query(`ALTER TABLE "departamentos" DROP CONSTRAINT "FK_departamentos_empresa"`);
    await queryRunner.query(`DROP TABLE "departamentos"`);
  }
}
