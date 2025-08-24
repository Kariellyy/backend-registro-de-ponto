import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
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

    // Validar geolocalização se fornecida
    let dentroDoRaio = true;
    if (
      registrarPontoDto.latitude &&
      registrarPontoDto.longitude &&
      empresa.latitude &&
      empresa.longitude
    ) {
      dentroDoRaio =
        this.calcularDistancia(
          registrarPontoDto.latitude,
          registrarPontoDto.longitude,
          empresa.latitude,
          empresa.longitude,
        ) <= empresa.raioPermitido;
    }

    // Criar registro
    const registro = this.registroPontoRepository.create({
      usuarioId,
      tipo: registrarPontoDto.tipo,
      dataHora: new Date(),
      latitude: registrarPontoDto.latitude,
      longitude: registrarPontoDto.longitude,
      endereco: registrarPontoDto.endereco,
      precisao: registrarPontoDto.precisao,
      dentroDoRaio,
      userAgent: registrarPontoDto.userAgent,
      ipAddress: registrarPontoDto.ipAddress,
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
  }> {
    const dataInicio = new Date(ano, mes - 1, 1);
    const dataFim = new Date(ano, mes, 0, 23, 59, 59);

    const registros = await this.registroPontoRepository.find({
      where: {
        usuarioId,
        dataHora: Between(dataInicio, dataFim),
        status: StatusRegistro.APROVADO,
      },
      order: { dataHora: 'ASC' },
    });

    // Calcular horas trabalhadas
    let horasTrabalhadas = 0;
    let entrada: Date | null = null;

    for (const registro of registros) {
      if (registro.tipo === TipoRegistro.ENTRADA) {
        entrada = registro.dataHora;
      } else if (registro.tipo === TipoRegistro.SAIDA && entrada) {
        const diffMs = registro.dataHora.getTime() - entrada.getTime();
        horasTrabalhadas += diffMs / (1000 * 60 * 60); // Converter para horas
        entrada = null;
      }
    }

    // Calcular horas previstas (8 horas por dia útil)
    const diasUteis = this.calcularDiasUteis(dataInicio, dataFim);
    const horasPrevistas = diasUteis * 8;

    // Calcular saldo do mês
    const saldoMes = horasTrabalhadas - horasPrevistas;

    // Calcular saldo total (todos os meses anteriores)
    const saldoTotal = await this.calcularSaldoTotal(usuarioId, dataInicio);

    return {
      saldoMes,
      horasTrabalhadas,
      horasPrevistas,
      saldoTotal: saldoTotal + saldoMes,
    };
  }

  private validarSequenciaRegistros(
    tipo: TipoRegistro,
    registrosHoje: RegistroPonto[],
  ): void {
    if (registrosHoje.length === 0) {
      if (tipo !== TipoRegistro.ENTRADA) {
        throw new BadRequestException(
          'Primeiro registro do dia deve ser de entrada',
        );
      }
      return;
    }

    const ultimoRegistro = registrosHoje[0];
    const sequenciaValida = this.obterSequenciaValida(ultimoRegistro.tipo);

    if (!sequenciaValida.includes(tipo)) {
      throw new BadRequestException(
        `Sequência inválida. Após ${ultimoRegistro.tipo}, o próximo registro deve ser: ${sequenciaValida.join(', ')}`,
      );
    }
  }

  private obterSequenciaValida(tipoAtual: TipoRegistro): TipoRegistro[] {
    switch (tipoAtual) {
      case TipoRegistro.ENTRADA:
        return [TipoRegistro.INTERVALO_INICIO, TipoRegistro.SAIDA];
      case TipoRegistro.INTERVALO_INICIO:
        return [TipoRegistro.INTERVALO_FIM];
      case TipoRegistro.INTERVALO_FIM:
        return [TipoRegistro.SAIDA];
      case TipoRegistro.SAIDA:
        return [TipoRegistro.ENTRADA]; // Próximo dia
      default:
        return [];
    }
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
      endereco: registro.endereco,
      precisao: registro.precisao,
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
}
