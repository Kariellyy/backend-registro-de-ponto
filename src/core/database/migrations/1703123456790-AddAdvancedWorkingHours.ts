import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAdvancedWorkingHours1703123456790
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar colunas na tabela empresas
    await queryRunner.addColumns('empresas', [
      new TableColumn({
        name: 'dias_funcionamento',
        type: 'jsonb',
        default: "'[1,2,3,4,5]'",
        comment:
          'Dias da semana que a empresa funciona (0=Dom, 1=Seg, ..., 6=Sab)',
      }),
      new TableColumn({
        name: 'horarios_por_dia',
        type: 'jsonb',
        default: `'{"1":{"inicio":"08:00","fim":"18:00","intervaloInicio":"12:00","intervaloFim":"14:00"},"2":{"inicio":"08:00","fim":"18:00","intervaloInicio":"12:00","intervaloFim":"14:00"},"3":{"inicio":"08:00","fim":"18:00","intervaloInicio":"12:00","intervaloFim":"14:00"},"4":{"inicio":"08:00","fim":"18:00","intervaloInicio":"12:00","intervaloFim":"14:00"},"5":{"inicio":"08:00","fim":"18:00","intervaloInicio":"12:00","intervaloFim":"14:00"}}'`,
        comment: 'Horários por dia da semana',
      }),
    ]);

    // Adicionar colunas na tabela usuarios
    await queryRunner.addColumns('usuarios', [
      new TableColumn({
        name: 'dias_trabalho',
        type: 'jsonb',
        default: "'[1,2,3,4,5]'",
        comment:
          'Dias da semana que o funcionário trabalha (0=Dom, 1=Seg, ..., 6=Sab)',
      }),
      new TableColumn({
        name: 'horarios_individuais',
        type: 'jsonb',
        isNullable: true,
        comment:
          'Horários específicos do funcionário por dia (sobrescreve horários da empresa)',
      }),
      new TableColumn({
        name: 'carga_horaria_semanal',
        type: 'decimal',
        precision: 4,
        scale: 2,
        default: 40,
        comment: 'Carga horária semanal contratual',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover colunas da tabela empresas
    await queryRunner.dropColumns('empresas', [
      'dias_funcionamento',
      'horarios_por_dia',
    ]);

    // Remover colunas da tabela usuarios
    await queryRunner.dropColumns('usuarios', [
      'dias_trabalho',
      'horarios_individuais',
      'carga_horaria_semanal',
    ]);
  }
}
