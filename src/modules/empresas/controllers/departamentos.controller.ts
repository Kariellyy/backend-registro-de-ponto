import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { JwtPayload } from '../../auth/interfaces/auth.interface';
import { CreateDepartamentoDto } from '../dto/create-departamento.dto';
import { UpdateDepartamentoDto } from '../dto/update-departamento.dto';
import { DepartamentosService } from '../services/departamentos.service';

@Controller('departamentos')
@UseGuards(JwtAuthGuard)
export class DepartamentosController {
  constructor(private readonly departamentosService: DepartamentosService) {}

  @Post()
  create(
    @Body() createDepartamentoDto: CreateDepartamentoDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.departamentosService.create(
      user.empresaId,
      createDepartamentoDto,
    );
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.departamentosService.findAllByEmpresa(user.empresaId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.departamentosService.findOne(id, user.empresaId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDepartamentoDto: UpdateDepartamentoDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.departamentosService.update(
      id,
      user.empresaId,
      updateDepartamentoDto,
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    // Verificar se há usuários vinculados ao departamento
    const hasUsers =
      await this.departamentosService.checkIfDepartamentoHasUsers(
        id,
        user.empresaId,
      );

    if (hasUsers) {
      throw new ForbiddenException(
        'Não é possível excluir o departamento pois há funcionários vinculados. ' +
          'Edite os funcionários para remover o vínculo antes de excluir o departamento.',
      );
    }

    return this.departamentosService.remove(id, user.empresaId);
  }
}
