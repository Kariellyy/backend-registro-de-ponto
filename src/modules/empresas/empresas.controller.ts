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
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/interfaces/auth.interface';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { EmpresasService } from './empresas.service';

@Controller('empresas')
@UseGuards(JwtAuthGuard)
export class EmpresasController {
  constructor(private readonly empresasService: EmpresasService) {}

  @Public()
  @Post()
  create(@Body() createEmpresaDto: CreateEmpresaDto) {
    return this.empresasService.create(createEmpresaDto);
  }

  @Get('me')
  findMyEmpresa(@CurrentUser() user: JwtPayload) {
    return this.empresasService.findOne(user.empresaId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    // Verificar se o usuário está tentando acessar sua própria empresa
    if (id !== user.empresaId) {
      throw new ForbiddenException('Acesso negado');
    }

    return this.empresasService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateEmpresaDto: UpdateEmpresaDto,
    @CurrentUser() user: JwtPayload,
  ) {
    // Verificar se o usuário está tentando atualizar sua própria empresa
    if (id !== user.empresaId) {
      throw new ForbiddenException('Acesso negado');
    }

    return this.empresasService.update(id, updateEmpresaDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    // Verificar se o usuário está tentando deletar sua própria empresa
    if (id !== user.empresaId) {
      throw new ForbiddenException('Acesso negado');
    }

    return this.empresasService.remove(id);
  }
}
