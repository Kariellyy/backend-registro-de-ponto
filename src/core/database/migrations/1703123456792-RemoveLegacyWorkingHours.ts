import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveLegacyWorkingHours1703123456792
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remover colunas de horários legados da tabela empresas
    await queryRunner.dropColumns('empresas', [
      'horario_inicio_manha',
      'horario_fim_manha',
      'horario_inicio_tarde',
      'horario_fim_tarde',
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recriar colunas de horários legados (caso seja necessário reverter)
    await queryRunner.query(`
      ALTER TABLE empresas 
      ADD COLUMN horario_inicio_manha TIME DEFAULT '08:00:00',
      ADD COLUMN horario_fim_manha TIME DEFAULT '12:00:00',
      ADD COLUMN horario_inicio_tarde TIME DEFAULT '14:00:00',
      ADD COLUMN horario_fim_tarde TIME DEFAULT '18:00:00'
    `);
  }
}
