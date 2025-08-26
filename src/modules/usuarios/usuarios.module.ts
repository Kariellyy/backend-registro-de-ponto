import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Departamento } from '../empresas/entities/departamento.entity';
import { HorarioFuncionario } from './entities/horario-funcionario.entity';
import { InformacoesTrabalhistas } from './entities/informacoes-trabalhistas.entity';
import { Usuario } from './entities/usuario.entity';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Usuario,
      InformacoesTrabalhistas,
      Departamento,
      HorarioFuncionario,
    ]),
  ],
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports: [UsuariosService],
})
export class UsuariosModule {}
