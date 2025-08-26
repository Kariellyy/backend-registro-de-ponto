import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { AprovarJustificativaDto } from './dto/aprovar-justificativa.dto';
import { CriarJustificativaDto } from './dto/criar-justificativa.dto';
import { RejeitarJustificativaDto } from './dto/rejeitar-justificativa.dto';
import { JustificativasService } from './justificativas.service';

@Controller('justificativas')
@UseGuards(JwtAuthGuard)
export class JustificativasController {
  constructor(private justificativasService: JustificativasService) {}

  @Post(':registroId')
  async criarJustificativa(
    @Param('registroId') registroId: string,
    @Body() dados: CriarJustificativaDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.justificativasService.criarJustificativa(registroId, dados);
  }

  @Post(':id/aprovar')
  async aprovarJustificativa(
    @Param('id') id: string,
    @Body() dados: AprovarJustificativaDto,
    @CurrentUser() aprovador: Usuario,
  ) {
    return this.justificativasService.aprovarJustificativa(
      id,
      aprovador.id,
      dados,
    );
  }

  @Post(':id/rejeitar')
  async rejeitarJustificativa(
    @Param('id') id: string,
    @Body() dados: RejeitarJustificativaDto,
    @CurrentUser() aprovador: Usuario,
  ) {
    return this.justificativasService.rejeitarJustificativa(
      id,
      aprovador.id,
      dados,
    );
  }

  @Get('pendentes')
  async buscarJustificativasPendentes(@CurrentUser() usuario: Usuario) {
    return this.justificativasService.buscarJustificativasPendentes(
      usuario.empresaId,
    );
  }

  @Get('minhas')
  async buscarMinhasJustificativas(@CurrentUser() usuario: Usuario) {
    return this.justificativasService.buscarJustificativasPorUsuario(
      usuario.id,
    );
  }

  @Get(':id')
  async buscarJustificativaPorId(@Param('id') id: string) {
    return this.justificativasService.buscarJustificativaPorId(id);
  }
}
