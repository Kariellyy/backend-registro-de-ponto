import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCompanyWorkingHoursAndToleranceFields1703123456789
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('empresas', [
      new TableColumn({
        name: 'horario_inicio_manha',
        type: 'time',
        default: "'08:00:00'",
        comment: 'Horário de início do expediente da manhã',
      }),
      new TableColumn({
        name: 'horario_fim_manha',
        type: 'time',
        default: "'12:00:00'",
        comment: 'Horário de fim do expediente da manhã',
      }),
      new TableColumn({
        name: 'horario_inicio_tarde',
        type: 'time',
        default: "'14:00:00'",
        comment: 'Horário de início do expediente da tarde',
      }),
      new TableColumn({
        name: 'horario_fim_tarde',
        type: 'time',
        default: "'18:00:00'",
        comment: 'Horário de fim do expediente da tarde',
      }),
      new TableColumn({
        name: 'tolerancia_entrada',
        type: 'int',
        default: 15,
        comment: 'Tolerância em minutos para entrada',
      }),
      new TableColumn({
        name: 'tolerancia_saida',
        type: 'int',
        default: 15,
        comment: 'Tolerância em minutos para saída',
      }),
      new TableColumn({
        name: 'permitir_registro_fora_raio',
        type: 'boolean',
        default: false,
        comment: 'Permite registro de ponto fora do raio da empresa',
      }),
      new TableColumn({
        name: 'exigir_justificativa_fora_raio',
        type: 'boolean',
        default: true,
        comment: 'Exige justificativa para registro fora do raio',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('empresas', [
      'horario_inicio_manha',
      'horario_fim_manha',
      'horario_inicio_tarde',
      'horario_fim_tarde',
      'tolerancia_entrada',
      'tolerancia_saida',
      'permitir_registro_fora_raio',
      'exigir_justificativa_fora_raio',
    ]);
  }
}
