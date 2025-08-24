import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateWorkingHoursStructure1703123456791
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar nova coluna de horários semanais na tabela empresas
    await queryRunner.addColumn(
      'empresas',
      new TableColumn({
        name: 'horarios_semanais',
        type: 'jsonb',
        default: `'{"1":{"ativo":true,"inicio":"08:00","fim":"18:00","temIntervalo":true,"intervaloInicio":"12:00","intervaloFim":"13:00"},"2":{"ativo":true,"inicio":"08:00","fim":"18:00","temIntervalo":true,"intervaloInicio":"12:00","intervaloFim":"13:00"},"3":{"ativo":true,"inicio":"08:00","fim":"18:00","temIntervalo":true,"intervaloInicio":"12:00","intervaloFim":"13:00"},"4":{"ativo":true,"inicio":"08:00","fim":"18:00","temIntervalo":true,"intervaloInicio":"12:00","intervaloFim":"13:00"},"5":{"ativo":true,"inicio":"08:00","fim":"18:00","temIntervalo":true,"intervaloInicio":"12:00","intervaloFim":"13:00"},"6":{"ativo":true,"inicio":"08:00","fim":"12:00","temIntervalo":false,"intervaloInicio":"","intervaloFim":""},"0":{"ativo":false,"inicio":"","fim":"","temIntervalo":false,"intervaloInicio":"","intervaloFim":""}}'`,
        comment: 'Horários de funcionamento por dia da semana (0=Dom, 1=Seg, ..., 6=Sab)',
      }),
    );

    // Adicionar nova coluna de horários do funcionário na tabela usuarios
    await queryRunner.addColumn(
      'usuarios',
      new TableColumn({
        name: 'horarios_funcionario',
        type: 'jsonb',
        isNullable: true,
        comment: 'Horários específicos do funcionário por dia da semana',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover colunas adicionadas
    await queryRunner.dropColumn('empresas', 'horarios_semanais');
    await queryRunner.dropColumn('usuarios', 'horarios_funcionario');
  }
}
