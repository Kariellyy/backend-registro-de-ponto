import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { DepartamentosController } from './departamentos.controller';
import { DepartamentosService } from './departamentos.service';
import { EmpresasController } from './empresas.controller';
import { EmpresasService } from './empresas.service';
import { Departamento } from './entities/departamento.entity';
import { Empresa } from './entities/empresa.entity';
import { HorarioEmpresa } from './entities/horario-empresa.entity';
import { Cargo } from './entities/cargo.entity';
import { CargosService } from './cargos.service';
import { CargosController } from './cargos.controller';

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
