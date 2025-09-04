import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { RegistrarPontoDto } from '../dto/registrar-ponto.dto';
import { PontoService } from '../services/ponto.service';

@Controller('ponto')
@UseGuards(JwtAuthGuard)
export class PontoController {
  constructor(private readonly pontoService: PontoService) {}

  @Post('registrar')
  async registrarPonto(
    @Body() registrarPontoDto: RegistrarPontoDto,
    @CurrentUser() user: Usuario,
  ) {
    return this.pontoService.registrarPonto(user.id, registrarPontoDto);
  }

  @Get('registros')
  async buscarRegistros(
    @CurrentUser() user: Usuario,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    const dataInicioDate = dataInicio ? new Date(dataInicio) : undefined;
    const dataFimDate = dataFim ? new Date(dataFim) : undefined;

    return this.pontoService.buscarRegistrosUsuario(
      user.id,
      dataInicioDate,
      dataFimDate,
    );
  }

  @Get('ultimo-registro')
  async buscarUltimoRegistro(@CurrentUser() user: Usuario) {
    return this.pontoService.buscarUltimoRegistro(user.id);
  }

  @Get('banco-horas')
  async calcularBancoHoras(
    @CurrentUser() user: Usuario,
    @Query('mes') mes: string,
    @Query('ano') ano: string,
  ) {
    const mesNum = parseInt(mes, 10);
    const anoNum = parseInt(ano, 10);

    if (isNaN(mesNum) || isNaN(anoNum)) {
      throw new Error('Mês e ano devem ser números válidos');
    }

    return this.pontoService.calcularBancoHoras(user.id, mesNum, anoNum);
  }

  @Get('relatorio-contador')
  async relatorioContador(
    @CurrentUser() user: Usuario,
    @Query('mes') mes: string,
    @Query('ano') ano: string,
  ) {
    const mesNum = parseInt(mes, 10);
    const anoNum = parseInt(ano, 10);
    if (isNaN(mesNum) || isNaN(anoNum)) {
      throw new Error('Mês e ano devem ser números válidos');
    }
    return this.pontoService.calcularRelatorioContador(
      user.empresaId,
      mesNum,
      anoNum,
    );
  }

  @Get('relatorio-contador/pdf')
  async relatorioContadorPdf(
    @CurrentUser() user: Usuario,
    @Query('mes') mes: string,
    @Query('ano') ano: string,
    @Res() res: Response,
  ) {
    const mesNum = parseInt(mes, 10);
    const anoNum = parseInt(ano, 10);
    if (isNaN(mesNum) || isNaN(anoNum)) {
      throw new Error('Mês e ano devem ser números válidos');
    }
    const { headers, buffer } =
      await this.pontoService.gerarRelatorioContadorPdf(
        user.empresaId,
        mesNum,
        anoNum,
      );
    res.set(headers);
    res.send(buffer);
  }
}
