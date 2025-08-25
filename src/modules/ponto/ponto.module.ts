import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Empresa } from '../empresas/entities/empresa.entity';
import { HorarioEmpresa } from '../empresas/entities/horario-empresa.entity';
import { HorarioFuncionario } from '../usuarios/entities/horario-funcionario.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { RegistroPonto } from './entities/registro-ponto.entity';
import { PontoController } from './ponto.controller';
import { PontoService } from './ponto.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RegistroPonto,
      Usuario,
      Empresa,
      HorarioEmpresa,
      HorarioFuncionario,
    ]),
  ],
  controllers: [PontoController],
  providers: [PontoService],
  exports: [PontoService],
})
export class PontoModule {}
