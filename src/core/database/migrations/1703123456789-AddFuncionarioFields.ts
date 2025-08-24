import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFuncionarioFields1703123456789 implements MigrationInterface {
  name = 'AddFuncionarioFields1703123456789';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD "cpf" character varying(14)`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD "cargo" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD "departamento" character varying(100)`,
    );
    await queryRunner.query(`ALTER TABLE "usuarios" ADD "dataAdmissao" date`);
    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD "horarioTrabalho" json`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "usuarios" DROP COLUMN "horarioTrabalho"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" DROP COLUMN "dataAdmissao"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" DROP COLUMN "departamento"`,
    );
    await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "cargo"`);
    await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "cpf"`);
  }
}
