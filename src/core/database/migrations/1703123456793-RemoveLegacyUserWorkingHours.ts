import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveLegacyUserWorkingHours1703123456793
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remover coluna de horário legado da tabela usuarios
    await queryRunner.dropColumn('usuarios', 'horario_trabalho');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recriar coluna de horário legado (caso seja necessário reverter)
    await queryRunner.query(`
      ALTER TABLE usuarios 
      ADD COLUMN horario_trabalho JSON DEFAULT NULL
    `);
  }
}
