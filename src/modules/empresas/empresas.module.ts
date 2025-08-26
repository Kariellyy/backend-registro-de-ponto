import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { CargosService } from './services/cargos.service';
import { CargosController } from './controllers/cargos.controller';
import { DepartamentosController } from './controllers/departamentos.controller';
import { EmpresasController } from './controllers/empresas.controller';
import { DepartamentosService } from './services/departamentos.service';
import { EmpresasService } from './services/empresas.service';
import { Cargo } from './entities/cargo.entity';
import { Departamento } from './entities/departamento.entity';
import { Empresa } from './entities/empresa.entity';
import { HorarioEmpresa } from './entities/horario-empresa.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Empresa,
      Departamento,
      Usuario,
      HorarioEmpresa,
      Cargo,
    ]),
  ],
  controllers: [EmpresasController, DepartamentosController, CargosController],
  providers: [EmpresasService, DepartamentosService, CargosService],
  exports: [EmpresasService, DepartamentosService, CargosService],
})
export class EmpresasModule {}
