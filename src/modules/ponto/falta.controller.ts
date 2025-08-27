import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { AprovarFaltaDto, RejeitarFaltaDto } from './dto/aprovar-falta.dto';
import { RegistrarFaltaDto } from './dto/registrar-falta.dto';
import { PontoService } from './ponto.service';

@Controller('faltas')
@UseGuards(JwtAuthGuard)
export class FaltaController {
  constructor(private readonly pontoService: PontoService) {}

  @Post()
  async registrarFalta(
    @Body() registrarFaltaDto: RegistrarFaltaDto,
    @CurrentUser() user: Usuario,
  ) {
    return this.pontoService.registrarFalta(user.id, registrarFaltaDto);
  }

  @Get()
  async buscarFaltas(
    @CurrentUser() user: Usuario,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    return this.pontoService.buscarFaltas(user.id, dataInicio, dataFim);
  }

  @Get('pendentes')
  async buscarFaltasPendentes(@CurrentUser() user: Usuario) {
    return this.pontoService.buscarFaltasPendentes(user.empresaId);
  }

  @Put(':id/aprovar')
  async aprovarFalta(
    @Param('id') faltaId: string,
    @Body() aprovarFaltaDto: AprovarFaltaDto,
    @CurrentUser() user: Usuario,
  ) {
    return this.pontoService.aprovarFalta(faltaId, user.id, aprovarFaltaDto);
  }

  @Put(':id/rejeitar')
  async rejeitarFalta(
    @Param('id') faltaId: string,
    @Body() rejeitarFaltaDto: RejeitarFaltaDto,
    @CurrentUser() user: Usuario,
  ) {
    return this.pontoService.rejeitarFalta(faltaId, user.id, rejeitarFaltaDto);
  }

  @Delete(':id')
  async deletarFalta(
    @Param('id') faltaId: string,
    @CurrentUser() user: Usuario,
  ) {
    return this.pontoService.deletarFalta(faltaId, user.id);
  }

  @Post('detectar-automaticas')
  async detectarFaltasAutomaticas(
    @Body() body: { data: string },
    @CurrentUser() user: Usuario,
  ) {
    const data = new Date(body.data);
    return this.pontoService.detectarFaltasAutomaticas(user.id, data);
  }

  @Post('detectar-retroativas')
  async detectarFaltasRetroativas(
    @Body() body: { dataInicio: string; dataFim: string },
    @CurrentUser() user: Usuario,
  ) {
    const dataInicio = new Date(body.dataInicio);
    const dataFim = new Date(body.dataFim);
    return this.pontoService.detectarFaltasRetroativas(
      user.id,
      dataInicio,
      dataFim,
    );
  }
}
