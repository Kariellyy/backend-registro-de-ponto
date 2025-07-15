import { Module } from '@nestjs/common';
import { DatabaseModule } from './core/database/database.module';
import { EmpresasModule } from './modules/empresas/empresas.module';
import { FuncionariosModule } from './modules/funcionarios/funcionarios.module';

@Module({
  imports: [DatabaseModule, EmpresasModule, FuncionariosModule],
  controllers: [],
  providers: [],
})
export class AppModule {}