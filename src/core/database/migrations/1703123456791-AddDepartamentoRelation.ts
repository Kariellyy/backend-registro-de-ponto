import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDepartamentoRelation1703123456791
  implements MigrationInterface
{
  name = 'AddDepartamentoRelation1703123456791';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "usuarios" 
      DROP COLUMN "departamento"
    `);

    await queryRunner.query(`
      ALTER TABLE "usuarios" 
      ADD "departamento_id" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "usuarios" 
      ADD CONSTRAINT "FK_usuarios_departamento" 
      FOREIGN KEY ("departamento_id") 
      REFERENCES "departamentos"("id") 
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "usuarios" 
      DROP CONSTRAINT "FK_usuarios_departamento"
    `);

    await queryRunner.query(`
      ALTER TABLE "usuarios" 
      DROP COLUMN "departamento_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "usuarios" 
      ADD "departamento" character varying(100)
    `);
  }
}
