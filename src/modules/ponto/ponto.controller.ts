import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/interfaces/auth.interface';
import { RegistrarPontoDto } from './dto/registrar-ponto.dto';
import { PontoService } from './ponto.service';

@Controller('ponto')
@UseGuards(JwtAuthGuard)
export class PontoController {
  constructor(private readonly pontoService: PontoService) {}

  @Post('registrar')
  async registrarPonto(
    @Body() registrarPontoDto: RegistrarPontoDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: any,
  ) {
    // Adicionar informações do dispositivo
    registrarPontoDto.userAgent = req.headers['user-agent'];
    registrarPontoDto.ipAddress = req.ip || req.connection.remoteAddress;

    return this.pontoService.registrarPonto(user.sub, registrarPontoDto);
  }

  @Get('registros')
  async buscarRegistros(
    @CurrentUser() user: JwtPayload,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    const dataInicioDate = dataInicio ? new Date(dataInicio) : undefined;
    const dataFimDate = dataFim ? new Date(dataFim) : undefined;

    return this.pontoService.buscarRegistrosUsuario(
      user.sub,
      dataInicioDate,
      dataFimDate,
    );
  }

  @Get('ultimo-registro')
  async buscarUltimoRegistro(@CurrentUser() user: JwtPayload) {
    return this.pontoService.buscarUltimoRegistro(user.sub);
  }

  @Get('banco-horas')
  async calcularBancoHoras(
    @CurrentUser() user: JwtPayload,
    @Query('mes') mes: string,
    @Query('ano') ano: string,
  ) {
    const mesNum = parseInt(mes, 10);
    const anoNum = parseInt(ano, 10);

    if (isNaN(mesNum) || isNaN(anoNum)) {
      throw new Error('Mês e ano devem ser números válidos');
    }

    return this.pontoService.calcularBancoHoras(user.sub, mesNum, anoNum);
  }
}
