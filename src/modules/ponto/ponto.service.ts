import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { UserRole } from '../../core/enums/user-role.enum';
import { UserStatus } from '../../core/enums/user-status.enum';
import { Empresa } from '../empresas/entities/empresa.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { AprovarFaltaDto, RejeitarFaltaDto } from './dto/aprovar-falta.dto';
import { FaltaResponseDto } from './dto/falta-response.dto';
import { RegistrarFaltaDto } from './dto/registrar-falta.dto';
import { RegistrarPontoDto } from './dto/registrar-ponto.dto';
import { RegistroPontoResponseDto } from './dto/registro-ponto-response.dto';
import { Falta, StatusFalta, TipoFalta } from './entities/falta.entity';
import {
  RegistroPonto,
  StatusRegistro,
  TipoRegistro,
} from './entities/registro-ponto.entity';
import { PontoValidatorService } from './ponto-validator.service';

@Injectable()
export class PontoService {
  constructor(
    @InjectRepository(RegistroPonto)
    private registroPontoRepository: Repository<RegistroPonto>,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    @InjectRepository(Empresa)
    private empresaRepository: Repository<Empresa>,
    @InjectRepository(Falta)
    private faltaRepository: Repository<Falta>,
    private pontoValidatorService: PontoValidatorService,
  ) {}

  /**
   * Método utilitário para criar datas no fuso horário local
   * Evita problemas de conversão UTC que podem causar diferença de 1 dia
   */
  private parseDateLocal(dateInput: string | Date): Date {
    let date: Date;

    if (typeof dateInput === 'string') {
      const [year, month, day] = dateInput.split('-').map(Number);
      date = new Date(year, month - 1, day);
    } else {
      // Se já é um Date, criar uma nova data local
      date = new Date(
        dateInput.getFullYear(),
        dateInput.getMonth(),
        dateInput.getDate(),
      );
    }

    return date;
  }

  async registrarPonto(
    usuarioId: string,
    registrarPontoDto: RegistrarPontoDto,
  ): Promise<RegistroPontoResponseDto> {
    // Buscar usuário
    const usuario = await this.usuarioRepository.findOne({
      where: { id: usuarioId },
      relations: ['empresa', 'informacoesTrabalhistas'],
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Validar se pode registrar ponto
    const validacao = await this.pontoValidatorService.validarRegistroPonto(
      usuario,
      registrarPontoDto.tipo,
      new Date(),
    );

    if (!validacao.podeRegistrar) {
      throw new BadRequestException(validacao.motivo);
    }

    // Buscar empresa
    const empresa = await this.empresaRepository.findOne({
      where: { id: usuario.empresaId },
    });

    if (!empresa) {
      throw new NotFoundException('Empresa não encontrada');
    }

    // Validar se já existe registro no mesmo dia
    const hoje = new Date();
    const inicioDia = new Date(
      hoje.getFullYear(),
      hoje.getMonth(),
      hoje.getDate(),
    );
    const fimDia = new Date(
      hoje.getFullYear(),
      hoje.getMonth(),
      hoje.getDate(),
      23,
      59,
      59,
    );

    const registrosHoje = await this.registroPontoRepository.find({
      where: {
        usuarioId,
        dataHora: Between(inicioDia, fimDia),
      },
      order: { dataHora: 'ASC' },
    });

    // Validar sequência de registros
    this.validarSequenciaRegistros(registrarPontoDto.tipo, registrosHoje);

    // Validar geolocalização
    let dentroDoRaio = true;
    if (empresa.latitude && empresa.longitude) {
      dentroDoRaio =
        this.calcularDistancia(
          registrarPontoDto.latitude,
          registrarPontoDto.longitude,
          empresa.latitude,
          empresa.longitude,
        ) <= empresa.raioPermitido;
    }

    // Determinar status baseado na configuração da empresa
    let status = StatusRegistro.APROVADO;
    if (!dentroDoRaio) {
      // Se a empresa exige justificativa para registros fora do raio
      if (empresa.exigirJustificativaForaRaio) {
        status = StatusRegistro.PENDENTE;
      } else {
        // Se não exige justificativa, aprova automaticamente
        status = StatusRegistro.APROVADO;
      }
    }

    // Criar registro
    const registro = this.registroPontoRepository.create({
      usuarioId,
      tipo: registrarPontoDto.tipo,
      dataHora: new Date(),
      latitude: registrarPontoDto.latitude,
      longitude: registrarPontoDto.longitude,
      dentroDoRaio,
      observacoes: registrarPontoDto.observacoes,
      status,
      temJustificativaPendente: false,
    });

    const registroSalvo = await this.registroPontoRepository.save(registro);

    return this.formatarResposta(registroSalvo, usuario);
  }

  async buscarRegistrosUsuario(
    usuarioId: string,
    dataInicio?: Date,
    dataFim?: Date,
  ): Promise<RegistroPontoResponseDto[]> {
    const query = this.registroPontoRepository
      .createQueryBuilder('registro')
      .leftJoinAndSelect('registro.usuario', 'usuario')
      .leftJoinAndSelect('registro.justificativas', 'justificativas')
      .where('registro.usuarioId = :usuarioId', { usuarioId })
      .orderBy('registro.dataHora', 'DESC');

    if (dataInicio && dataFim) {
      query.andWhere('registro.dataHora BETWEEN :dataInicio AND :dataFim', {
        dataInicio,
        dataFim,
      });
    }

    const registros = await query.getMany();

    return registros.map((registro) =>
      this.formatarResposta(registro, registro.usuario),
    );
  }

  async buscarUltimoRegistro(
    usuarioId: string,
  ): Promise<RegistroPontoResponseDto | null> {
    const registro = await this.registroPontoRepository.findOne({
      where: { usuarioId },
      relations: ['usuario', 'justificativas'],
      order: { dataHora: 'DESC' },
    });

    if (!registro) {
      return null;
    }

    return this.formatarResposta(registro, registro.usuario);
  }

  async calcularBancoHoras(
    usuarioId: string,
    mes: number,
    ano: number,
  ): Promise<{
    saldoMes: number;
    horasTrabalhadas: number;
    horasPrevistas: number;
    horasJustificadas: number;
    saldoTotal: number;
    diasTrabalhados: number;
    diasUteis: number;
    horasSemanais: number;
    semanasTrabalhadas: number;
    dataCalculoAte: Date;
  }> {
    // Buscar usuário com todas as relações necessárias
    const usuario = await this.usuarioRepository.findOne({
      where: { id: usuarioId },
      relations: [
        'empresa',
        'empresa.horarios',
        'horarios',
        'informacoesTrabalhistas',
      ],
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (!usuario.informacoesTrabalhistas?.inicioRegistros) {
      throw new BadRequestException(
        'Data de início dos registros não configurada',
      );
    }

    // Definir período de cálculo
    const dataInicioMes = new Date(ano, mes - 1, 1);
    const dataFimMes = new Date(ano, mes, 0, 23, 59, 59, 999);
    const hoje = new Date();

    // Data de início dos registros (data basal)
    const dataInicioRegistros = this.parseDateLocal(
      usuario.informacoesTrabalhistas.inicioRegistros,
    );

    // Data de início efetiva para o mês (não pode ser anterior ao início dos registros)
    const dataInicioCalculo =
      dataInicioRegistros > dataInicioMes ? dataInicioRegistros : dataInicioMes;

    // Data de fim efetiva (não pode ser posterior a hoje)
    const dataFimCalculo = hoje < dataFimMes ? hoje : dataFimMes;

    // Buscar registros do período
    const registros = await this.registroPontoRepository.find({
      where: {
        usuarioId,
        dataHora: Between(dataInicioCalculo, dataFimCalculo),
        status: In([StatusRegistro.APROVADO, StatusRegistro.JUSTIFICADO]),
      },
      order: { dataHora: 'ASC' },
    });

    // Calcular horas trabalhadas
    const horasTrabalhadas = this.calcularHorasTrabalhadas(registros);

    // Calcular horas previstas (desde início dos registros até hoje)
    const horasPrevistas = this.calcularHorasPrevistas(
      dataInicioRegistros,
      dataFimCalculo,
      usuario,
    );

    console.log(
      `[CALCULO_BANCO_HORAS] Período de cálculo para horas justificadas:`,
    );
    console.log(
      `  - Data início cálculo: ${dataInicioCalculo.toISOString().split('T')[0]}`,
    );
    console.log(
      `  - Data fim cálculo: ${dataFimCalculo.toISOString().split('T')[0]}`,
    );

    // Calcular horas justificadas baseadas em faltas aprovadas
    const horasJustificadas = await this.calcularHorasJustificadas(
      usuarioId,
      dataInicioCalculo,
      dataFimCalculo,
      usuario,
    );

    // Calcular dias trabalhados
    const diasTrabalhados = this.calcularDiasTrabalhados(registros);

    // Calcular dias úteis no período
    const diasUteis = this.calcularDiasUteis(
      dataInicioCalculo,
      dataFimCalculo,
      usuario,
    );

    // Calcular semanas trabalhadas
    const semanasTrabalhadas = this.calcularSemanasTrabalhadas(
      dataInicioCalculo,
      dataFimCalculo,
    );

    // Carga horária semanal
    const horasSemanais = Number(
      usuario.informacoesTrabalhistas?.cargaHorariaSemanal || 40,
    );

    // Calcular saldo do mês (considerando horas justificadas)
    const saldoMes = horasTrabalhadas + horasJustificadas - horasPrevistas;

    // Calcular saldo total (todos os meses anteriores)
    const saldoTotal = await this.calcularSaldoTotal(
      usuarioId,
      usuario,
      dataInicioCalculo,
    );

    return {
      saldoMes: Math.round(saldoMes * 100) / 100,
      horasTrabalhadas: Math.round(horasTrabalhadas * 100) / 100,
      horasPrevistas: Math.round(horasPrevistas * 100) / 100,
      horasJustificadas: Math.round(horasJustificadas * 100) / 100,
      saldoTotal: Math.round((saldoTotal + saldoMes) * 100) / 100,
      diasTrabalhados,
      diasUteis,
      horasSemanais,
      semanasTrabalhadas,
      dataCalculoAte: dataFimCalculo,
    };
  }

  private validarSequenciaRegistros(
    tipo: TipoRegistro,
    registrosHoje: RegistroPonto[],
  ): void {
    // Verificar se já existe registro do mesmo tipo hoje
    const jaRegistrado = registrosHoje.some(
      (registro) => registro.tipo === tipo,
    );
    if (jaRegistrado) {
      throw new BadRequestException(
        `Você já registrou ${this.getTipoLabel(tipo)} hoje`,
      );
    }

    // Verificar se todos os registros do dia estão completos (máximo 4 registros)
    if (registrosHoje.length >= 4) {
      throw new BadRequestException(
        'Todos os registros do dia já foram feitos (entrada, intervalo início, intervalo fim, saída)',
      );
    }

    // Validar sequência baseada no primeiro registro (sem registros)
    if (registrosHoje.length === 0) {
      if (tipo !== TipoRegistro.ENTRADA) {
        throw new BadRequestException(
          'O primeiro registro do dia deve ser de entrada',
        );
      }
      return;
    }

    // Validar sequência baseada no último registro
    const ultimoRegistro = registrosHoje[registrosHoje.length - 1];
    const proximoTipoEsperado = this.obterProximoTipoEsperado(
      ultimoRegistro.tipo,
    );

    if (tipo !== proximoTipoEsperado) {
      throw new BadRequestException(
        `O próximo registro deve ser: ${this.getTipoLabel(proximoTipoEsperado)}`,
      );
    }
  }

  private obterProximoTipoEsperado(tipoAtual: TipoRegistro): TipoRegistro {
    switch (tipoAtual) {
      case TipoRegistro.ENTRADA:
        return TipoRegistro.INTERVALO_INICIO;
      case TipoRegistro.INTERVALO_INICIO:
        return TipoRegistro.INTERVALO_FIM;
      case TipoRegistro.INTERVALO_FIM:
        return TipoRegistro.SAIDA;
      default:
        throw new BadRequestException(
          'Todos os registros do dia já foram completados',
        );
    }
  }

  private getTipoLabel(tipo: TipoRegistro): string {
    const labels = {
      [TipoRegistro.ENTRADA]: 'entrada',
      [TipoRegistro.INTERVALO_INICIO]: 'início do intervalo',
      [TipoRegistro.INTERVALO_FIM]: 'fim do intervalo',
      [TipoRegistro.SAIDA]: 'saída',
    };
    return labels[tipo] || tipo;
  }

  private calcularDistancia(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3; // Raio da Terra em metros
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distância em metros
  }

  private formatarResposta(
    registro: RegistroPonto,
    usuario: Usuario,
  ): RegistroPontoResponseDto {
    return {
      id: registro.id,
      tipo: registro.tipo,
      status: registro.status,
      dataHora: registro.dataHora,
      latitude: registro.latitude,
      longitude: registro.longitude,
      dentroDoRaio: registro.dentroDoRaio,
      observacoes: registro.observacoes,
      temJustificativaPendente: registro.temJustificativaPendente,
      createdAt: registro.createdAt,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
      },
    };
  }

  private calcularHorasTrabalhadas(registros: RegistroPonto[]): number {
    const registrosPorDia = new Map<string, RegistroPonto[]>();

    // Agrupar registros por dia
    for (const registro of registros) {
      const data = registro.dataHora.toISOString().split('T')[0];
      if (!registrosPorDia.has(data)) {
        registrosPorDia.set(data, []);
      }
      registrosPorDia.get(data)!.push(registro);
    }

    let totalHoras = 0;

    // Calcular horas para cada dia
    for (const [data, registrosDia] of registrosPorDia) {
      const horasDia = this.calcularHorasDia(registrosDia);
      totalHoras += horasDia;
    }

    return totalHoras;
  }

  private calcularHorasDia(registros: RegistroPonto[]): number {
    if (registros.length === 0) return 0;

    // Ordenar registros por data/hora
    registros.sort((a, b) => a.dataHora.getTime() - b.dataHora.getTime());

    let horasTrabalhadas = 0;
    let entrada: Date | null = null;
    let saidaIntervalo: Date | null = null;

    for (const registro of registros) {
      switch (registro.tipo) {
        case TipoRegistro.ENTRADA:
          entrada = registro.dataHora;
          break;

        case TipoRegistro.INTERVALO_INICIO:
          if (entrada) {
            const horasManha =
              (registro.dataHora.getTime() - entrada.getTime()) /
              (1000 * 60 * 60);
            horasTrabalhadas += horasManha;
          }
          break;

        case TipoRegistro.INTERVALO_FIM:
          saidaIntervalo = registro.dataHora;
          break;

        case TipoRegistro.SAIDA:
          if (saidaIntervalo) {
            // Com intervalo: calcular tarde (fim do intervalo até saída)
            const horasTarde =
              (registro.dataHora.getTime() - saidaIntervalo.getTime()) /
              (1000 * 60 * 60);
            horasTrabalhadas += horasTarde;
          } else if (entrada) {
            // Sem intervalo: calcular total (entrada até saída)
            const horasTotal =
              (registro.dataHora.getTime() - entrada.getTime()) /
              (1000 * 60 * 60);
            horasTrabalhadas += horasTotal;
          }
          break;
      }
    }

    return horasTrabalhadas;
  }

  private calcularHorasPrevistas(
    dataInicio: Date,
    dataFim: Date,
    usuario: any,
  ): number {
    let horasTotal = 0;
    const data = new Date(dataInicio);

    while (data <= dataFim) {
      const diaSemana = data.getDay();
      const horasDia = this.calcularHorasDiaPrevistas(diaSemana, usuario);

      if (horasDia > 0) {
        horasTotal += horasDia;
      }

      data.setDate(data.getDate() + 1);
    }

    return horasTotal;
  }

  private calcularHorasDiaPrevistas(diaSemana: number, usuario: any): number {
    const diasSemana = [
      'Domingo',
      'Segunda',
      'Terça',
      'Quarta',
      'Quinta',
      'Sexta',
      'Sábado',
    ];
    const diaSemanaNome = diasSemana[diaSemana];

    console.log(
      `[CALCULO_HORAS_DIA] Calculando horas para ${diaSemanaNome} (dia ${diaSemana})`,
    );
    console.log(
      `[CALCULO_HORAS_DIA] Usuário tem horários individuais: ${usuario.horarios && usuario.horarios.length > 0 ? 'SIM' : 'NÃO'}`,
    );
    console.log(
      `[CALCULO_HORAS_DIA] Usuário tem horários da empresa: ${usuario.empresa?.horarios && usuario.empresa.horarios.length > 0 ? 'SIM' : 'NÃO'}`,
    );

    // Priorizar horários individuais do funcionário
    if (usuario.horarios && usuario.horarios.length > 0) {
      const horarioFuncionario = usuario.horarios.find(
        (h) => h.diaSemana === diaSemana,
      );

      console.log(
        `[CALCULO_HORAS_DIA] Horário funcionário encontrado: ${horarioFuncionario ? 'SIM' : 'NÃO'}`,
      );
      if (horarioFuncionario) {
        console.log(
          `[CALCULO_HORAS_DIA] Horário funcionário ativo: ${horarioFuncionario.ativo ? 'SIM' : 'NÃO'}`,
        );
        console.log(
          `[CALCULO_HORAS_DIA] Horário funcionário: ${horarioFuncionario.horarioInicio} - ${horarioFuncionario.horarioFim}`,
        );
      }

      if (horarioFuncionario && horarioFuncionario.ativo) {
        const horas = this.calcularHorasHorario(horarioFuncionario);
        console.log(
          `[CALCULO_HORAS_DIA] Usando horário funcionário: ${horas}h`,
        );
        return horas;
      }
    }

    // Fallback para horários da empresa
    if (usuario.empresa?.horarios && usuario.empresa.horarios.length > 0) {
      const horarioEmpresa = usuario.empresa.horarios.find(
        (h) => h.diaSemana === diaSemana,
      );

      console.log(
        `[CALCULO_HORAS_DIA] Horário empresa encontrado: ${horarioEmpresa ? 'SIM' : 'NÃO'}`,
      );
      if (horarioEmpresa) {
        console.log(
          `[CALCULO_HORAS_DIA] Horário empresa ativo: ${horarioEmpresa.ativo ? 'SIM' : 'NÃO'}`,
        );
        console.log(
          `[CALCULO_HORAS_DIA] Horário empresa: ${horarioEmpresa.horarioInicio} - ${horarioEmpresa.horarioFim}`,
        );
      }

      if (horarioEmpresa && horarioEmpresa.ativo) {
        const horas = this.calcularHorasHorario(horarioEmpresa);
        console.log(`[CALCULO_HORAS_DIA] Usando horário empresa: ${horas}h`);
        return horas;
      }
    }

    console.log(
      `[CALCULO_HORAS_DIA] Nenhum horário encontrado para ${diaSemanaNome}: 0h`,
    );
    return 0;
  }

  private calcularHorasHorario(horario: any): number {
    console.log(
      `[CALCULO_HORAS_HORARIO] Iniciando cálculo para horário: ${horario.horarioInicio} - ${horario.horarioFim}`,
    );

    if (!horario.horarioInicio || !horario.horarioFim) {
      console.log(
        `[CALCULO_HORAS_HORARIO] Horário incompleto: início=${horario.horarioInicio}, fim=${horario.horarioFim}`,
      );
      return 0;
    }

    const inicio = this.parseHorario(horario.horarioInicio);
    const fim = this.parseHorario(horario.horarioFim);
    let horasTotal = fim - inicio;

    console.log(
      `[CALCULO_HORAS_HORARIO] Cálculo básico: ${horario.horarioInicio} (${inicio}h) até ${horario.horarioFim} (${fim}h) = ${horasTotal}h`,
    );

    // Descontar intervalo se existir
    if (
      horario.temIntervalo &&
      horario.intervaloInicio &&
      horario.intervaloFim
    ) {
      const intervaloInicio = this.parseHorario(horario.intervaloInicio);
      const intervaloFim = this.parseHorario(horario.intervaloFim);
      const horasIntervalo = intervaloFim - intervaloInicio;
      horasTotal -= horasIntervalo;
      console.log(
        `[CALCULO_HORAS_HORARIO] Descontando intervalo: ${horario.intervaloInicio} até ${horario.intervaloFim} = ${horasIntervalo}h`,
      );
    }

    console.log(
      `[CALCULO_HORAS_HORARIO] Horas totais calculadas: ${horasTotal}h`,
    );
    return horasTotal;
  }

  private parseHorario(horario: string): number {
    const [horas, minutos] = horario.split(':').map(Number);
    return horas + minutos / 60;
  }

  private calcularDiasTrabalhados(registros: RegistroPonto[]): number {
    const diasTrabalhados = new Set<string>();

    for (const registro of registros) {
      const data = registro.dataHora.toISOString().split('T')[0];
      diasTrabalhados.add(data);
    }

    return diasTrabalhados.size;
  }

  private calcularDiasUteis(
    dataInicio: Date,
    dataFim: Date,
    usuario: any,
  ): number {
    let diasUteis = 0;
    const data = new Date(dataInicio);

    while (data <= dataFim) {
      const diaSemana = data.getDay();
      const horasDia = this.calcularHorasDiaPrevistas(diaSemana, usuario);

      if (horasDia > 0) {
        diasUteis++;
      }

      data.setDate(data.getDate() + 1);
    }

    return diasUteis;
  }

  private calcularSemanasTrabalhadas(dataInicio: Date, dataFim: Date): number {
    const diffTime = dataFim.getTime() - dataInicio.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.ceil(diffDays / 7);
  }

  private async calcularSaldoTotal(
    usuarioId: string,
    usuario: any,
    dataLimite: Date,
  ): Promise<number> {
    const dataInicioRegistros = this.parseDateLocal(
      usuario.informacoesTrabalhistas.inicioRegistros,
    );

    // Buscar registros desde o início dos registros até o limite
    const registros = await this.registroPontoRepository.find({
      where: {
        usuarioId,
        dataHora: Between(dataInicioRegistros, dataLimite),
        status: In([StatusRegistro.APROVADO, StatusRegistro.JUSTIFICADO]),
      },
      order: { dataHora: 'ASC' },
    });

    // Calcular horas trabalhadas totais
    const horasTrabalhadasTotal = this.calcularHorasTrabalhadas(registros);

    // Calcular horas previstas totais
    const horasPrevistasTotal = this.calcularHorasPrevistas(
      dataInicioRegistros,
      dataLimite,
      usuario,
    );

    // Calcular horas justificadas totais
    const horasJustificadasTotal = await this.calcularHorasJustificadas(
      usuarioId,
      dataInicioRegistros,
      dataLimite,
      usuario,
    );

    return horasTrabalhadasTotal + horasJustificadasTotal - horasPrevistasTotal;
  }

  private getDiaSemana(dia: number): string {
    const dias = [
      'Domingo',
      'Segunda',
      'Terça',
      'Quarta',
      'Quinta',
      'Sexta',
      'Sábado',
    ];
    return dias[dia];
  }

  // ===== MÉTODOS DE FALTA =====

  async registrarFalta(
    usuarioId: string,
    registrarFaltaDto: RegistrarFaltaDto,
  ): Promise<FaltaResponseDto> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id: usuarioId },
      relations: ['informacoesTrabalhistas'],
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const data = this.parseDateLocal(registrarFaltaDto.data);

    // Verificar se já existe falta para esta data
    const faltaExistente = await this.faltaRepository.findOne({
      where: {
        usuarioId: usuarioId,
        data: data,
      },
    });

    if (faltaExistente) {
      throw new BadRequestException(
        'Já existe uma falta registrada para esta data',
      );
    }

    const falta = this.faltaRepository.create({
      usuarioId: usuarioId,
      data: data,
      tipo: registrarFaltaDto.tipo,
      motivo: registrarFaltaDto.motivo,
      observacoes: registrarFaltaDto.observacoes,
      horarioInicioEfetivo: registrarFaltaDto.horarioInicioEfetivo,
      horarioFimEfetivo: registrarFaltaDto.horarioFimEfetivo,
      minutosAtraso: registrarFaltaDto.minutosAtraso,
      minutosSaidaAntecipada: registrarFaltaDto.minutosSaidaAntecipada,
      status: StatusFalta.PENDENTE,
    });

    const faltaSalva = await this.faltaRepository.save(falta);

    return this.formatarRespostaFalta(faltaSalva, usuario);
  }

  async buscarFaltas(
    usuarioId: string,
    dataInicio?: string,
    dataFim?: string,
  ): Promise<FaltaResponseDto[]> {
    const query = this.faltaRepository
      .createQueryBuilder('falta')
      .leftJoinAndSelect('falta.usuario', 'usuario')
      .leftJoinAndSelect('falta.aprovador', 'aprovador')
      .where('falta.usuarioId = :usuarioId', { usuarioId })
      .orderBy('falta.data', 'DESC');

    if (dataInicio && dataFim) {
      const dataInicioDate = this.parseDateLocal(dataInicio);
      const dataFimDate = this.parseDateLocal(dataFim);
      query.andWhere('falta.data BETWEEN :dataInicio AND :dataFim', {
        dataInicio: dataInicioDate,
        dataFim: dataFimDate,
      });
    }

    const faltas = await query.getMany();

    return faltas.map((falta) =>
      this.formatarRespostaFalta(falta, falta.usuario),
    );
  }

  async buscarFaltasEmpresa(
    empresaId: string,
    dataInicio?: string,
    dataFim?: string,
  ): Promise<FaltaResponseDto[]> {
    const query = this.faltaRepository
      .createQueryBuilder('falta')
      .leftJoinAndSelect('falta.usuario', 'usuario')
      .leftJoinAndSelect('falta.aprovador', 'aprovador')
      .where('usuario.empresaId = :empresaId', { empresaId })
      .orderBy('falta.data', 'DESC');

    if (dataInicio && dataFim) {
      const dataInicioDate = this.parseDateLocal(dataInicio);
      const dataFimDate = this.parseDateLocal(dataFim);
      query.andWhere('falta.data BETWEEN :dataInicio AND :dataFim', {
        dataInicio: dataInicioDate,
        dataFim: dataFimDate,
      });
    }

    const faltas = await query.getMany();

    return faltas.map((falta) =>
      this.formatarRespostaFalta(falta, falta.usuario),
    );
  }

  async buscarFaltasPendentes(empresaId: string): Promise<FaltaResponseDto[]> {
    const faltas = await this.faltaRepository
      .createQueryBuilder('falta')
      .leftJoinAndSelect('falta.usuario', 'usuario')
      .leftJoinAndSelect('falta.aprovador', 'aprovador')
      .where('falta.status = :status', { status: StatusFalta.PENDENTE })
      .andWhere('usuario.empresaId = :empresaId', { empresaId })
      .orderBy('falta.data', 'DESC')
      .getMany();

    console.log('Faltas pendentes encontradas:', faltas.length);
    if (faltas.length > 0) {
      console.log(
        'Primeira falta - data:',
        faltas[0].data,
        'tipo:',
        typeof faltas[0].data,
      );
    }

    return faltas.map((falta) =>
      this.formatarRespostaFalta(falta, falta.usuario),
    );
  }

  async aprovarFalta(
    faltaId: string,
    aprovadorId: string,
    aprovarFaltaDto: AprovarFaltaDto,
  ): Promise<FaltaResponseDto> {
    console.log(`[APROVAR_FALTA] Iniciando aprovação da falta ${faltaId}`);

    const falta = await this.faltaRepository.findOne({
      where: { id: faltaId },
      relations: ['usuario'],
    });

    if (!falta) {
      throw new NotFoundException('Falta não encontrada');
    }

    console.log(`[APROVAR_FALTA] Falta encontrada:`);
    console.log(`  - Data: ${falta.data.toISOString().split('T')[0]}`);
    console.log(`  - Tipo: ${falta.tipo}`);
    console.log(`  - Status atual: ${falta.status}`);
    console.log(`  - Usuário: ${falta.usuario.nome}`);

    if (falta.status !== StatusFalta.PENDENTE) {
      throw new BadRequestException('Falta já foi processada');
    }

    falta.status = StatusFalta.APROVADA;
    falta.aprovadoPor = aprovadorId;
    falta.dataAprovacao = new Date();
    falta.observacoes = aprovarFaltaDto.observacoes || null;

    const faltaAtualizada = await this.faltaRepository.save(falta);

    console.log(
      `[APROVAR_FALTA] Falta aprovada com sucesso. Status: ${faltaAtualizada.status}`,
    );

    return this.formatarRespostaFalta(faltaAtualizada, falta.usuario);
  }

  async rejeitarFalta(
    faltaId: string,
    aprovadorId: string,
    rejeitarFaltaDto: RejeitarFaltaDto,
  ): Promise<FaltaResponseDto> {
    const falta = await this.faltaRepository.findOne({
      where: { id: faltaId },
      relations: ['usuario'],
    });

    if (!falta) {
      throw new NotFoundException('Falta não encontrada');
    }

    if (falta.status !== StatusFalta.PENDENTE) {
      throw new BadRequestException('Falta já foi processada');
    }

    falta.status = StatusFalta.REJEITADA;
    falta.aprovadoPor = aprovadorId;
    falta.dataAprovacao = new Date();
    falta.observacoes = rejeitarFaltaDto.motivo;

    const faltaAtualizada = await this.faltaRepository.save(falta);

    return this.formatarRespostaFalta(faltaAtualizada, falta.usuario);
  }

  async deletarFalta(faltaId: string, usuarioId: string): Promise<void> {
    // Buscar a falta pelo ID
    const falta = await this.faltaRepository.findOne({
      where: { id: faltaId },
      relations: ['usuario'],
    });

    if (!falta) {
      throw new NotFoundException('Falta não encontrada');
    }

    // Buscar o usuário que está tentando deletar
    const usuario = await this.usuarioRepository.findOne({
      where: { id: usuarioId },
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar permissão: usuário pode deletar sua própria falta ou faltas da empresa se for admin
    const podeDeletar =
      falta.usuarioId === usuarioId || // Própria falta
      (usuario.papel === UserRole.ADMINISTRADOR &&
        falta.usuario.empresaId === usuario.empresaId) || // Admin da mesma empresa
      (usuario.papel === UserRole.DONO &&
        falta.usuario.empresaId === usuario.empresaId); // Dono da empresa

    if (!podeDeletar) {
      throw new BadRequestException('Sem permissão para deletar esta falta');
    }

    if (falta.status !== StatusFalta.PENDENTE) {
      throw new BadRequestException(
        'Não é possível deletar uma falta já processada',
      );
    }

    await this.faltaRepository.remove(falta);
  }

  async detectarFaltasAutomaticas(
    usuarioId: string,
    data: Date,
  ): Promise<void> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id: usuarioId },
      relations: ['informacoesTrabalhistas'],
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Detectar faltas para todos os funcionários da empresa
    await this.detectarFaltasParaEmpresa(usuario.empresaId, data);
  }

  async detectarFaltasParaEmpresa(
    empresaId: string,
    data: Date,
  ): Promise<void> {
    // Buscar todos os funcionários ativos da empresa
    const funcionarios = await this.usuarioRepository.find({
      where: { empresaId: empresaId, status: UserStatus.ATIVO },
      relations: ['informacoesTrabalhistas'],
    });

    console.log(
      `Detectando faltas para ${funcionarios.length} funcionários da empresa ${empresaId} na data ${data.toISOString().split('T')[0]}`,
    );

    for (const funcionario of funcionarios) {
      try {
        await this.pontoValidatorService.detectarFaltasAutomaticas(
          funcionario,
          data,
        );
      } catch (error) {
        console.error(
          `Erro ao detectar faltas para funcionário ${funcionario.id}:`,
          error,
        );
      }
    }
  }

  async detectarFaltasRetroativas(
    usuarioId: string,
    dataInicio: Date,
    dataFim: Date,
  ): Promise<void> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id: usuarioId },
      relations: ['informacoesTrabalhistas'],
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Detectar faltas para todos os funcionários da empresa no período
    await this.detectarFaltasRetroativasParaEmpresa(
      usuario.empresaId,
      dataInicio,
      dataFim,
    );
  }

  async detectarFaltasRetroativasParaEmpresa(
    empresaId: string,
    dataInicio: Date,
    dataFim: Date,
  ): Promise<void> {
    // Buscar todos os funcionários ativos da empresa
    const funcionarios = await this.usuarioRepository.find({
      where: { empresaId: empresaId, status: UserStatus.ATIVO },
      relations: ['informacoesTrabalhistas'],
    });

    // Ajustar data fim para excluir o dia atual (regra de negócio)
    const hoje = new Date();
    const dataFimAjustada = new Date(dataFim);

    // Se a data fim for o dia atual, ajustar para o dia anterior
    if (dataFimAjustada.toDateString() === hoje.toDateString()) {
      dataFimAjustada.setDate(dataFimAjustada.getDate() - 1);
      console.log(
        `Data fim ajustada de ${dataFim.toISOString().split('T')[0]} para ${dataFimAjustada.toISOString().split('T')[0]} (excluindo dia atual)`,
      );
    }

    console.log(
      `Detectando faltas retroativas para ${funcionarios.length} funcionários da empresa ${empresaId} de ${dataInicio.toISOString().split('T')[0]} até ${dataFimAjustada.toISOString().split('T')[0]}`,
    );

    // Iterar por cada dia no período (até a data fim ajustada)
    const dataAtual = new Date(dataInicio);
    while (dataAtual <= dataFimAjustada) {
      for (const funcionario of funcionarios) {
        try {
          await this.pontoValidatorService.detectarFaltasAutomaticas(
            funcionario,
            new Date(dataAtual),
          );
        } catch (error) {
          console.error(
            `Erro ao detectar faltas retroativas para funcionário ${funcionario.id} na data ${dataAtual.toISOString().split('T')[0]}:`,
            error,
          );
        }
      }
      dataAtual.setDate(dataAtual.getDate() + 1);
    }
  }

  private async calcularHorasJustificadas(
    usuarioId: string,
    dataInicio: Date,
    dataFim: Date,
    usuario: Usuario,
  ): Promise<number> {
    console.log(
      `[CALCULO_HORAS_JUSTIFICADAS] Iniciando cálculo para usuário ${usuarioId}`,
    );
    console.log(
      `[CALCULO_HORAS_JUSTIFICADAS] Período: ${dataInicio.toISOString().split('T')[0]} até ${dataFim.toISOString().split('T')[0]}`,
    );

    // Buscar faltas aprovadas no período
    const faltasAprovadas = await this.faltaRepository.find({
      where: {
        usuarioId,
        data: Between(dataInicio, dataFim),
        status: StatusFalta.APROVADA,
      },
    });

    console.log(
      `[CALCULO_HORAS_JUSTIFICADAS] Encontradas ${faltasAprovadas.length} faltas aprovadas`,
    );

    let horasJustificadas = 0;
    const diasSemana = [
      'Domingo',
      'Segunda',
      'Terça',
      'Quarta',
      'Quinta',
      'Sexta',
      'Sábado',
    ];

    for (const falta of faltasAprovadas) {
      // Converter string de data para Date local
      const dataFalta = this.parseDateLocal(falta.data);
      const diaSemana = dataFalta.getDay();
      const diaSemanaNome = diasSemana[diaSemana];

      console.log(`[CALCULO_HORAS_JUSTIFICADAS] Analisando falta ${falta.id}:`);
      console.log(`  - Data original: ${falta.data}`);
      console.log(
        `  - Data convertida: ${dataFalta.toISOString().split('T')[0]} (${diaSemanaNome})`,
      );
      console.log(`  - Tipo: ${falta.tipo}`);
      console.log(`  - Status: ${falta.status}`);

      // Calcular horas que deveriam ser trabalhadas neste dia
      const horasDiaPrevistas = this.calcularHorasDiaPrevistas(
        diaSemana,
        usuario,
      );

      console.log(
        `  - Horas previstas para ${diaSemanaNome}: ${horasDiaPrevistas}h`,
      );
      
      // Verificar se é sábado e se está sendo calculado corretamente
      if (diaSemana === 6) {
        console.log(`[CALCULO_HORAS_JUSTIFICADAS] ⚠️ SÁBADO DETECTADO! Data: ${falta.data} - Horas previstas: ${horasDiaPrevistas}h`);
      }

      // Para faltas completas, considerar todas as horas do dia
      if (
        falta.tipo === TipoFalta.FALTA_JUSTIFICADA ||
        falta.tipo === TipoFalta.FALTA_INJUSTIFICADA
      ) {
        horasJustificadas += horasDiaPrevistas;
        console.log(
          `  - Falta completa: +${horasDiaPrevistas}h (Total acumulado: ${horasJustificadas}h)`,
        );
      }
      // Para faltas parciais, calcular baseado nos horários efetivos
      else if (
        falta.tipo === TipoFalta.FALTA_PARCIAL &&
        falta.horarioInicioEfetivo &&
        falta.horarioFimEfetivo
      ) {
        const horasTrabalhadas = this.calcularHorasEntreHorarios(
          falta.horarioInicioEfetivo,
          falta.horarioFimEfetivo,
        );
        const horasJustificadasFalta = horasDiaPrevistas - horasTrabalhadas;
        horasJustificadas += horasJustificadasFalta;
        console.log(
          `  - Falta parcial: ${horasTrabalhadas}h trabalhadas, +${horasJustificadasFalta}h justificadas (Total: ${horasJustificadas}h)`,
        );
      }
      // Para atrasos, considerar apenas os minutos de atraso
      else if (falta.tipo === TipoFalta.ATRASO && falta.minutosAtraso) {
        const horasAtraso = falta.minutosAtraso / 60;
        horasJustificadas += horasAtraso;
        console.log(
          `  - Atraso: +${horasAtraso}h (Total: ${horasJustificadas}h)`,
        );
      }
      // Para saídas antecipadas, considerar apenas os minutos antecipados
      else if (
        falta.tipo === TipoFalta.SAIDA_ANTECIPADA &&
        falta.minutosSaidaAntecipada
      ) {
        const horasSaidaAntecipada = falta.minutosSaidaAntecipada / 60;
        horasJustificadas += horasSaidaAntecipada;
        console.log(
          `  - Saída antecipada: +${horasSaidaAntecipada}h (Total: ${horasJustificadas}h)`,
        );
      }
    }

    console.log(
      `[CALCULO_HORAS_JUSTIFICADAS] Total final: ${horasJustificadas}h`,
    );
    return horasJustificadas;
  }

  private calcularHorasEntreHorarios(
    horarioInicio: string,
    horarioFim: string,
  ): number {
    const [horaInicio, minutoInicio] = horarioInicio.split(':').map(Number);
    const [horaFim, minutoFim] = horarioFim.split(':').map(Number);

    const minutosInicio = horaInicio * 60 + minutoInicio;
    const minutosFim = horaFim * 60 + minutoFim;

    const diferencaMinutos = minutosFim - minutosInicio;
    return Math.max(0, diferencaMinutos / 60);
  }

  private formatarRespostaFalta(
    falta: Falta,
    usuario: Usuario,
  ): FaltaResponseDto {
    // Formatar data para evitar problemas de fuso horário
    const dataFormatada = this.formatarDataParaString(falta.data);
    const dataAprovacaoFormatada = falta.dataAprovacao
      ? this.formatarDataParaString(falta.dataAprovacao)
      : undefined;
    const createdAtFormatada = this.formatarDataParaString(falta.createdAt);
    const updatedAtFormatada = this.formatarDataParaString(falta.updatedAt);

    return {
      id: falta.id,
      usuarioId: falta.usuarioId,
      data: dataFormatada,
      tipo: falta.tipo,
      status: falta.status,
      motivo: falta.motivo || undefined,
      observacoes: falta.observacoes || undefined,
      horarioInicioEfetivo: falta.horarioInicioEfetivo || undefined,
      horarioFimEfetivo: falta.horarioFimEfetivo || undefined,
      minutosAtraso: falta.minutosAtraso || undefined,
      minutosSaidaAntecipada: falta.minutosSaidaAntecipada || undefined,
      aprovadoPor: falta.aprovadoPor || undefined,
      dataAprovacao: dataAprovacaoFormatada,
      createdAt: createdAtFormatada,
      updatedAt: updatedAtFormatada,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
      },
      aprovador: falta.aprovador
        ? {
            id: falta.aprovador.id,
            nome: falta.aprovador.nome,
            email: falta.aprovador.email,
          }
        : undefined,
    };
  }

  private formatarDataParaString(data: Date | string | any): string {
    // Se já é uma string, retornar como está
    if (typeof data === 'string') {
      return data;
    }

    // Se é um objeto Date, formatar
    if (data instanceof Date) {
      const ano = data.getFullYear();
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const dia = String(data.getDate()).padStart(2, '0');
      return `${ano}-${mes}-${dia}`;
    }

    // Se é um objeto com propriedades de data (pode acontecer com TypeORM)
    if (data && typeof data === 'object') {
      // Tentar converter para Date
      try {
        const dateObj = new Date(data);
        if (!isNaN(dateObj.getTime())) {
          const ano = dateObj.getFullYear();
          const mes = String(dateObj.getMonth() + 1).padStart(2, '0');
          const dia = String(dateObj.getDate()).padStart(2, '0');
          return `${ano}-${mes}-${dia}`;
        }
      } catch (error) {
        console.error('Erro ao converter data:', error, 'Data recebida:', data);
      }
    }

    // Fallback para outros tipos
    console.warn('Tipo de data inesperado:', typeof data, data);
    return String(data);
  }
}
