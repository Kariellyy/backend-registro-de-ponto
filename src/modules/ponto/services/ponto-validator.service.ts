import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Empresa } from '../../empresas/entities/empresa.entity';
import { HorarioFuncionario } from '../../usuarios/entities/horario-funcionario.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Falta, StatusFalta, TipoFalta } from '../entities/falta.entity';
import { RegistroPonto, TipoRegistro } from '../entities/registro-ponto.entity';

@Injectable()
export class PontoValidatorService {
  constructor(
    @InjectRepository(RegistroPonto)
    private registroPontoRepository: Repository<RegistroPonto>,
    @InjectRepository(Falta)
    private faltaRepository: Repository<Falta>,
    @InjectRepository(HorarioFuncionario)
    private horarioFuncionarioRepository: Repository<HorarioFuncionario>,
    @InjectRepository(Empresa)
    private empresaRepository: Repository<Empresa>,
  ) {}

  async validarRegistroPonto(
    usuario: Usuario,
    tipo: TipoRegistro,
    dataHora: Date,
  ): Promise<{
    podeRegistrar: boolean;
    motivo?: string;
    falta?: Falta;
    exigeJustificativa?: boolean;
  }> {
    const data = new Date(dataHora);
    const diaSemana = data.getDay();
    const hora = data.getHours();
    const minutos = data.getMinutes();

    // 1. Verificar se já existe falta registrada para este dia
    const faltaExistente = await this.faltaRepository.findOne({
      where: {
        usuarioId: usuario.id,
        data: data,
        status: StatusFalta.APROVADA,
      },
    });

    if (faltaExistente) {
      return {
        podeRegistrar: false,
        motivo: `Dia marcado como ${faltaExistente.tipo}`,
        falta: faltaExistente,
      };
    }

    // 2. Buscar empresa para obter tolerâncias
    const empresa = await this.empresaRepository.findOne({
      where: { id: usuario.empresaId },
    });

    if (!empresa) {
      throw new BadRequestException('Empresa não encontrada');
    }

    // 3. Buscar horário do funcionário para este dia
    const horario = await this.horarioFuncionarioRepository.findOne({
      where: {
        usuarioId: usuario.id,
        diaSemana: diaSemana,
        ativo: true,
      },
    });

    if (!horario) {
      return {
        podeRegistrar: false,
        motivo: 'Não há horário configurado para este dia',
      };
    }

    // 4. Verificar se está dentro do período permitido (máximo 1 dia atrás)
    const hoje = new Date();
    const limiteRetroativo = new Date(hoje);
    limiteRetroativo.setDate(limiteRetroativo.getDate() - 1);

    if (data < limiteRetroativo) {
      return {
        podeRegistrar: false,
        motivo: 'Registro muito antigo. Máximo 1 dia atrás',
      };
    }

    // 5. Validar horário específico baseado no tipo
    if (tipo === TipoRegistro.ENTRADA) {
      return this.validarEntrada(usuario, horario, empresa, data);
    } else if (tipo === TipoRegistro.SAIDA) {
      return this.validarSaida(usuario, horario, empresa, data);
    }

    // Para intervalos, permitir sempre
    return { podeRegistrar: true };
  }

  private validarEntrada(
    usuario: Usuario,
    horario: HorarioFuncionario,
    empresa: Empresa,
    data: Date,
  ): { podeRegistrar: boolean; motivo?: string; exigeJustificativa?: boolean } {
    if (!horario.horarioInicio) {
      return {
        podeRegistrar: false,
        motivo: 'Horário de início não configurado',
      };
    }

    const [horaInicio, minInicio] = horario.horarioInicio
      .split(':')
      .map(Number);
    const horaAtual = data.getHours();
    const minAtual = data.getMinutes();

    const minutosInicio = horaInicio * 60 + minInicio;
    const minutosAtual = horaAtual * 60 + minAtual;

    // Permitir entrada até X minutos após o horário de início
    if (minutosAtual > minutosInicio + empresa.toleranciaEntrada) {
      return {
        podeRegistrar: true,
        motivo: `Entrada fora do horário (tolerância ${empresa.toleranciaEntrada} min após ${horario.horarioInicio})`,
        exigeJustificativa: true,
      };
    }

    return { podeRegistrar: true };
  }

  private validarSaida(
    usuario: Usuario,
    horario: HorarioFuncionario,
    empresa: Empresa,
    data: Date,
  ): { podeRegistrar: boolean; motivo?: string; exigeJustificativa?: boolean } {
    if (!horario.horarioFim) {
      return { podeRegistrar: false, motivo: 'Horário de fim não configurado' };
    }

    const [horaFim, minFim] = horario.horarioFim.split(':').map(Number);
    const horaAtual = data.getHours();
    const minAtual = data.getMinutes();

    const minutosFim = horaFim * 60 + minFim;
    const minutosAtual = horaAtual * 60 + minAtual;

    // Permitir saída até X minutos antes do horário de fim
    if (minutosAtual < minutosFim - empresa.toleranciaSaida) {
      return {
        podeRegistrar: true,
        motivo: `Saída fora do horário (tolerância ${empresa.toleranciaSaida} min antes de ${horario.horarioFim})`,
        exigeJustificativa: true,
      };
    }

    return { podeRegistrar: true };
  }

  async detectarFaltasAutomaticas(usuario: Usuario, data: Date): Promise<void> {
    // Verificar se o funcionário deveria estar trabalhando a partir da data inicioRegistros
    if (!usuario.informacoesTrabalhistas?.inicioRegistros) {
      console.log(
        `Funcionário ${usuario.id} não tem data de início de registros configurada`,
      );
      return;
    }

    const dataInicioRegistros = new Date(
      usuario.informacoesTrabalhistas.inicioRegistros,
    );

    // Se a data for anterior ao início dos registros, não detectar falta
    if (data < dataInicioRegistros) {
      console.log(
        `Data ${data.toISOString().split('T')[0]} é anterior ao início dos registros ${dataInicioRegistros.toISOString().split('T')[0]} para funcionário ${usuario.id}`,
      );
      return;
    }

    const diaSemana = data.getDay();

    // Buscar horário do dia
    const horario = await this.horarioFuncionarioRepository.findOne({
      where: {
        usuarioId: usuario.id,
        diaSemana: diaSemana,
        ativo: true,
      },
    });

    if (!horario) {
      console.log(
        `Funcionário ${usuario.id} não tem horário configurado para o dia ${diaSemana} (${this.getDiaSemana(diaSemana)})`,
      );
      return; // Não há horário configurado para este dia
    }

    // Buscar registros do dia
    const inicioDia = new Date(data);
    inicioDia.setHours(0, 0, 0, 0);
    const fimDia = new Date(data);
    fimDia.setHours(23, 59, 59, 999);

    const registros = await this.registroPontoRepository.find({
      where: {
        usuarioId: usuario.id,
        dataHora: Between(inicioDia, fimDia),
      },
      order: { dataHora: 'ASC' },
    });

    // Verificar se já existe falta registrada
    const faltaExistente = await this.faltaRepository.findOne({
      where: {
        usuarioId: usuario.id,
        data: data,
      },
    });

    if (faltaExistente) {
      console.log(
        `Já existe falta registrada para funcionário ${usuario.id} na data ${data.toISOString().split('T')[0]}`,
      );
      return; // Já existe falta registrada
    }

    console.log(
      `Analisando funcionário ${usuario.id} na data ${data.toISOString().split('T')[0]}: ${registros.length} registros encontrados`,
    );

    // Lógica para detectar faltas
    if (registros.length === 0) {
      // Falta completa
      console.log(
        `Detectando FALTA_INJUSTIFICADA para funcionário ${usuario.id} na data ${data.toISOString().split('T')[0]}`,
      );
      await this.registrarFalta(
        usuario,
        data,
        TipoFalta.FALTA_INJUSTIFICADA,
        'Funcionário não registrou nenhum ponto',
      );
    } else if (registros.length < 4) {
      // Falta parcial - analisar registros
      await this.analisarFaltaParcial(usuario, data, registros, horario);
    }
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

  private async registrarFalta(
    usuario: Usuario,
    data: Date,
    tipo: TipoFalta,
    motivo?: string,
  ): Promise<void> {
    const falta = this.faltaRepository.create({
      usuarioId: usuario.id,
      data: data,
      tipo: tipo,
      motivo: motivo || null,
      status: StatusFalta.PENDENTE,
    });

    await this.faltaRepository.save(falta);
  }

  private async analisarFaltaParcial(
    usuario: Usuario,
    data: Date,
    registros: RegistroPonto[],
    horario: HorarioFuncionario,
  ): Promise<void> {
    const tiposRegistrados = registros.map((r) => r.tipo);

    // Verificar se tem entrada mas não tem saída
    if (
      tiposRegistrados.includes(TipoRegistro.ENTRADA) &&
      !tiposRegistrados.includes(TipoRegistro.SAIDA)
    ) {
      await this.registrarFalta(
        usuario,
        data,
        TipoFalta.SAIDA_ANTECIPADA,
        'Funcionário não registrou saída',
      );
    }

    // Verificar se tem saída mas não tem entrada
    if (
      tiposRegistrados.includes(TipoRegistro.SAIDA) &&
      !tiposRegistrados.includes(TipoRegistro.ENTRADA)
    ) {
      await this.registrarFalta(
        usuario,
        data,
        TipoFalta.ATRASO,
        'Funcionário não registrou entrada',
      );
    }

    // Verificar se tem apenas intervalos (sem entrada ou saída)
    if (
      tiposRegistrados.length > 0 &&
      !tiposRegistrados.includes(TipoRegistro.ENTRADA) &&
      !tiposRegistrados.includes(TipoRegistro.SAIDA)
    ) {
      await this.registrarFalta(
        usuario,
        data,
        TipoFalta.FALTA_PARCIAL,
        'Funcionário registrou apenas intervalos',
      );
    }
  }

  async calcularAtraso(
    usuario: Usuario,
    data: Date,
    horarioEntrada: string,
  ): Promise<number> {
    const [horaInicio, minInicio] = horarioEntrada.split(':').map(Number);
    const minutosInicio = horaInicio * 60 + minInicio;

    const horaAtual = data.getHours();
    const minAtual = data.getMinutes();
    const minutosAtual = horaAtual * 60 + minAtual;

    return Math.max(0, minutosAtual - minutosInicio);
  }

  async calcularSaidaAntecipada(
    usuario: Usuario,
    data: Date,
    horarioSaida: string,
  ): Promise<number> {
    const [horaFim, minFim] = horarioSaida.split(':').map(Number);
    const minutosFim = horaFim * 60 + minFim;

    const horaAtual = data.getHours();
    const minAtual = data.getMinutes();
    const minutosAtual = horaAtual * 60 + minAtual;

    return Math.max(0, minutosFim - minutosAtual);
  }
}
