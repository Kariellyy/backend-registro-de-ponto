import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Empresa } from '../empresas/entities/empresa.entity';
import { HorarioEmpresa } from '../empresas/entities/horario-empresa.entity';
import { HorarioFuncionario } from '../usuarios/entities/horario-funcionario.entity';
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
      order: { dataHora: 'DESC' },
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

    // Verificar se empresa permite registro fora do raio
    if (!dentroDoRaio && !empresa.permitirRegistroForaRaio) {
      throw new BadRequestException(
        'Registro de ponto não permitido fora do raio da empresa',
      );
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
      status: dentroDoRaio ? StatusRegistro.APROVADO : StatusRegistro.PENDENTE,
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
      relations: ['usuario'],
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
  }> {
    // Buscar usuário e empresa
    const usuario = await this.usuarioRepository.findOne({
      where: { id: usuarioId },
      relations: ['empresa', 'empresa.horarios', 'horarios'],
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const dataInicio = new Date(ano, mes - 1, 1);
    const dataFim = new Date(ano, mes, 0, 23, 59, 59);

    // Considerar data de admissão
    let dataInicioCalculo = dataInicio;
    if (usuario.dataAdmissao) {
      const dataAdmissao = new Date(usuario.dataAdmissao);
      if (dataAdmissao > dataInicio) {
        dataInicioCalculo = dataAdmissao;
      }
    }

    const registros = await this.registroPontoRepository.find({
      where: {
        usuarioId,
        dataHora: Between(dataInicioCalculo, dataFim),
        status: StatusRegistro.APROVADO,
      },
      order: { dataHora: 'ASC' },
    });

    // Calcular horas trabalhadas considerando intervalos
    const horasTrabalhadas = this.calcularHorasTrabalhadasPorDia(registros);

    // Calcular horas previstas baseadas na configuração do usuário/empresa
    const horasPrevistas = this.calcularHorasPrevisasNovas(
      dataInicioCalculo,
      dataFim,
      usuario,
    );

    // Calcular dias trabalhados e úteis
    const diasTrabalhados = this.calcularDiasTrabalhados(registros);
    const diasUteis = this.calcularDiasUteisDoUsuario(
      dataInicioCalculo,
      dataFim,
      usuario,
    );

    // Calcular horas semanais
    const semanasTrabalhadas = this.calcularSemanas(dataInicioCalculo, dataFim);
    const horasSemanais = usuario.cargaHorariaSemanal || 40;

    // Calcular saldo do mês
    const saldoMes = horasTrabalhadas - horasPrevistas;

    // Calcular saldo total (todos os meses anteriores)
    const saldoTotal = await this.calcularSaldoTotal(
      usuarioId,
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

  private calcularHorasTrabalhadasPorDia(registros: RegistroPonto[]): number {
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
            // Calcular manhã (entrada até início do intervalo)
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
            // Calcular tarde (fim do intervalo até saída)
            const horasTarde =
              (registro.dataHora.getTime() - saidaIntervalo.getTime()) /
              (1000 * 60 * 60);
            horasTrabalhadas += horasTarde;
          } else if (entrada) {
            // Jornada sem intervalo registrado
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

  private calcularHorasPrevisasNovas(
    dataInicio: Date,
    dataFim: Date,
    usuario: Usuario,
  ): number {
    let horasTotal = 0;
    const data = new Date(dataInicio);

    while (data <= dataFim) {
      const diaSemana = data.getDay();
      const horaseDia = this.calcularHorasDiaPrevistas(diaSemana, usuario);
      if (horaseDia > 0) {
        horasTotal += horaseDia;
      }

      data.setDate(data.getDate() + 1);
    }

    return horasTotal;
  }

  private calcularHorasDiaPrevistas(
    diaSemana: number,
    usuario: Usuario,
  ): number {
    try {
      // Priorizar horários individuais do funcionário
      if (usuario.horarios && usuario.horarios.length > 0) {
        const horariosFuncionario = this.converterHorariosFuncionario(
          usuario.horarios,
        );

        if (horariosFuncionario[diaSemana.toString()]) {
          const horario = horariosFuncionario[diaSemana.toString()];

          // Verificar se o funcionário trabalha neste dia
          if (!horario.ativo) {
            return 0;
          }

          const inicio = this.parseHorario(horario.inicio);
          const fim = this.parseHorario(horario.fim);
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
      }

      // Fallback para horários da empresa
      if (
        usuario.empresa &&
        usuario.empresa.horarios &&
        usuario.empresa.horarios.length > 0
      ) {
        const horariosEmpresa = this.converterHorariosEmpresa(
          usuario.empresa.horarios,
        );

        if (horariosEmpresa[diaSemana.toString()]) {
          const horario = horariosEmpresa[diaSemana.toString()];

          // Verificar se a empresa funciona neste dia
          if (!horario.ativo) {
            return 0;
          }

          const inicio = this.parseHorario(horario.inicio);
          const fim = this.parseHorario(horario.fim);
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
      }

      return 0;
    } catch (error) {
      console.error('Erro ao calcular horas previstas:', error);
      return 0;
    }
  }

  private calcularDiasUteisDoUsuario(
    dataInicio: Date,
    dataFim: Date,
    usuario: Usuario,
  ): number {
    let diasUteis = 0;
    const data = new Date(dataInicio);

    while (data <= dataFim) {
      const diaSemana = data.getDay();
      const horasDia = this.calcularHorasDiaPrevistas(diaSemana, usuario);

      // Contar como dia útil se o funcionário tem horas previstas neste dia
      if (horasDia > 0) {
        diasUteis++;
      }

      data.setDate(data.getDate() + 1);
    }

    return diasUteis;
  }

  private calcularSemanas(dataInicio: Date, dataFim: Date): number {
    const diffTime = dataFim.getTime() - dataInicio.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.ceil(diffDays / 7);
  }

  private calcularDiasUteis(dataInicio: Date, dataFim: Date): number {
    let diasUteis = 0;
    const data = new Date(dataInicio);

    while (data <= dataFim) {
      const diaSemana = data.getDay();
      if (diaSemana !== 0 && diaSemana !== 6) {
        // 0 = Domingo, 6 = Sábado
        diasUteis++;
      }
      data.setDate(data.getDate() + 1);
    }

    return diasUteis;
  }

  private async calcularSaldoTotal(
    usuarioId: string,
    dataLimite: Date,
  ): Promise<number> {
    const registros = await this.registroPontoRepository.find({
      where: {
        usuarioId,
        dataHora: Between(new Date(0), dataLimite),
        status: StatusRegistro.APROVADO,
      },
      order: { dataHora: 'ASC' },
    });

    let saldoTotal = 0;
    let entrada: Date | null = null;

    for (const registro of registros) {
      if (registro.tipo === TipoRegistro.ENTRADA) {
        entrada = registro.dataHora;
      } else if (registro.tipo === TipoRegistro.SAIDA && entrada) {
        const diffMs = registro.dataHora.getTime() - entrada.getTime();
        const horasTrabalhadas = diffMs / (1000 * 60 * 60);
        saldoTotal += horasTrabalhadas - 8; // 8 horas por dia
        entrada = null;
      }
    }

    return saldoTotal;
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
      createdAt: registro.createdAt,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
      },
    };
  }

  // Funções utilitárias para conversão de horários
  private converterHorariosFuncionario(horarios: HorarioFuncionario[]): {
    [diaSemana: string]: any;
  } {
    const resultado: { [diaSemana: string]: any } = {};

    horarios.forEach((horario) => {
      resultado[horario.diaSemana.toString()] = {
        ativo: horario.ativo,
        inicio: horario.horarioInicio || '',
        fim: horario.horarioFim || '',
        temIntervalo: horario.temIntervalo,
        intervaloInicio: horario.intervaloInicio || '',
        intervaloFim: horario.intervaloFim || '',
      };
    });

    return resultado;
  }

  private converterHorariosEmpresa(horarios: HorarioEmpresa[]): {
    [diaSemana: string]: any;
  } {
    const resultado: { [diaSemana: string]: any } = {};

    horarios.forEach((horario) => {
      resultado[horario.diaSemana.toString()] = {
        ativo: horario.ativo,
        inicio: horario.horarioInicio || '',
        fim: horario.horarioFim || '',
        temIntervalo: horario.temIntervalo,
        intervaloInicio: horario.intervaloInicio || '',
        intervaloFim: horario.intervaloFim || '',
      };
    });

    return resultado;
  }
}
