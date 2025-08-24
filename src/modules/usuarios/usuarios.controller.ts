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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/interfaces/auth.interface';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { UsuariosService } from './usuarios.service';

@Controller('usuarios')
@UseGuards(JwtAuthGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  create(
    @Body() createUsuarioDto: CreateUsuarioDto,
    @CurrentUser() user: JwtPayload,
  ) {
    // Adicionar o empresaId do usuário autenticado
    return this.usuariosService.create({
      ...createUsuarioDto,
      empresaId: user.empresaId,
    });
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    // Retorna apenas administradores e funcionários, excluindo o dono da empresa
    return this.usuariosService.findByEmpresa(user.empresaId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const usuario = await this.usuariosService.findOne(id);

    // Verificar se o usuário pertence à mesma empresa
    if (usuario.empresaId !== user.empresaId) {
      throw new ForbiddenException('Acesso negado');
    }

    return usuario;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const usuario = await this.usuariosService.findOne(id);

    // Verificar se o usuário pertence à mesma empresa
    if (usuario.empresaId !== user.empresaId) {
      throw new ForbiddenException('Acesso negado');
    }

    return this.usuariosService.update(id, updateUsuarioDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const usuario = await this.usuariosService.findOne(id);

    // Verificar se o usuário pertence à mesma empresa
    if (usuario.empresaId !== user.empresaId) {
      throw new ForbiddenException('Acesso negado');
    }

    // Impedir que o usuário delete a si mesmo
    if (usuario.id === user.sub) {
      throw new ForbiddenException('Não é possível excluir sua própria conta');
    }

    await this.usuariosService.remove(id);

    return {
      message: 'Funcionário excluído com sucesso',
      deletedId: id,
    };
  }
}
