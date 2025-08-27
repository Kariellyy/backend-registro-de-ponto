import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { Empresa } from '../empresas/entities/empresa.entity';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { RegistrarPontoDto } from './dto/registrar-ponto.dto';
import { RegistroPontoResponseDto } from './dto/registro-ponto-response.dto';
import {
  RegistroPonto,
  StatusRegistro,
  TipoRegistro,
} from './entities/registro-ponto.entity';

@Injectable()
export class PontoService {
  constructor(
    @InjectRepository(RegistroPonto)
    private registroPontoRepository: Repository<RegistroPonto>,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    @InjectRepository(Empresa)
    private empresaRepository: Repository<Empresa>,
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

    console.log(
      `[DEBUG] parseDateLocal: ${dateInput} -> ${date.toISOString()}`,
    );

    return date;
  }

  async registrarPonto(
    usuarioId: string,
    registrarPontoDto: RegistrarPontoDto,
  ): Promise<RegistroPontoResponseDto> {
    // Buscar usuário
    const usuario = await this.usuarioRepository.findOne({
      where: { id: usuarioId },
      relations: ['empresa'],
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
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

    console.log('=== CÁLCULO BANCO DE HORAS ===');
    console.log('Data início registros:', dataInicioRegistros.toISOString());
    console.log('Data fim cálculo:', dataFimCalculo.toISOString());

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

    // Calcular saldo do mês
    const saldoMes = horasTrabalhadas - horasPrevistas;

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
    // Priorizar horários individuais do funcionário
    if (usuario.horarios && usuario.horarios.length > 0) {
      const horarioFuncionario = usuario.horarios.find(
        (h) => h.diaSemana === diaSemana,
      );

      if (horarioFuncionario && horarioFuncionario.ativo) {
        return this.calcularHorasHorario(horarioFuncionario);
      }
    }

    // Fallback para horários da empresa
    if (usuario.empresa?.horarios && usuario.empresa.horarios.length > 0) {
      const horarioEmpresa = usuario.empresa.horarios.find(
        (h) => h.diaSemana === diaSemana,
      );

      if (horarioEmpresa && horarioEmpresa.ativo) {
        return this.calcularHorasHorario(horarioEmpresa);
      }
    }

    return 0;
  }

  private calcularHorasHorario(horario: any): number {
    if (!horario.horarioInicio || !horario.horarioFim) return 0;

    const inicio = this.parseHorario(horario.horarioInicio);
    const fim = this.parseHorario(horario.horarioFim);
    let horasTotal = fim - inicio;

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
    }

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

    return horasTrabalhadasTotal - horasPrevistasTotal;
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
}
