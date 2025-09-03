import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Empresa } from '../empresas/entities/empresa.entity';
import { HorarioEmpresa } from '../empresas/entities/horario-empresa.entity';
import { HorarioFuncionario } from '../usuarios/entities/horario-funcionario.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { FaltaController } from './controllers/falta.controller';
import { JustificativasController } from './controllers/justificativas.controller';
import { PontoController } from './controllers/ponto.controller';
import { Falta } from './entities/falta.entity';
import { Justificativa } from './entities/justificativa.entity';
import { RegistroPonto } from './entities/registro-ponto.entity';
import { JustificativasService } from './services/justificativas.service';
import { PontoValidatorService } from './services/ponto-validator.service';
import { PontoService } from './services/ponto.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RegistroPonto,
      Justificativa,
      Falta,
      Usuario,
      Empresa,
      HorarioEmpresa,
      HorarioFuncionario,
    ]),
  ],
  controllers: [PontoController, FaltaController, JustificativasController],
  providers: [PontoService, PontoValidatorService, JustificativasService],
  exports: [PontoService, PontoValidatorService, JustificativasService],
})
export class PontoModule {}
