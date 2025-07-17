import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './core/database/database.module';
import { EmpresasModule } from './modules/empresas/empresas.module';
import { FuncionariosModule } from './modules/funcionarios/funcionarios.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule, 
    EmpresasModule, 
    FuncionariosModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}