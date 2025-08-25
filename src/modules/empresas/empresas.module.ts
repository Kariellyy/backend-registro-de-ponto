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

@Module({
  imports: [
    TypeOrmModule.forFeature([Empresa, Departamento, Usuario, HorarioEmpresa]),
  ],
  controllers: [EmpresasController, DepartamentosController],
  providers: [EmpresasService, DepartamentosService],
  exports: [EmpresasService, DepartamentosService],
})
export class EmpresasModule {}
