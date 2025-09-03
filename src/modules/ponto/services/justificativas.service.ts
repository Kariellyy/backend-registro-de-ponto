import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AprovarJustificativaDto } from '../dto/aprovar-justificativa.dto';
import { CriarJustificativaDto } from '../dto/criar-justificativa.dto';
import { RejeitarJustificativaDto } from '../dto/rejeitar-justificativa.dto';
import {
  Justificativa,
  StatusJustificativa,
} from '../entities/justificativa.entity';
import {
  RegistroPonto,
  StatusRegistro,
} from '../entities/registro-ponto.entity';

@Injectable()
export class JustificativasService {
  constructor(
    @InjectRepository(Justificativa)
    private justificativaRepository: Repository<Justificativa>,
    @InjectRepository(RegistroPonto)
    private registroPontoRepository: Repository<RegistroPonto>,
  ) {}

  async criarJustificativa(
    registroPontoId: string,
    dados: CriarJustificativaDto,
  ): Promise<Justificativa> {
    // Verificar se registro existe e está pendente
    const registro = await this.registroPontoRepository.findOne({
      where: { id: registroPontoId, status: StatusRegistro.PENDENTE },
    });

    if (!registro) {
      throw new NotFoundException(
        'Registro não encontrado ou não está pendente',
      );
    }

    const justificativa = this.justificativaRepository.create({
      registroPontoId,
      motivo: dados.motivo,
      observacoes: dados.observacoes,
      tipo: dados.tipo,
    });

    // Atualizar registro para indicar que tem justificativa
    await this.registroPontoRepository.update(registroPontoId, {
      temJustificativaPendente: true,
    });

    return this.justificativaRepository.save(justificativa);
  }

  async aprovarJustificativa(
    justificativaId: string,
    aprovadorId: string,
    dados: AprovarJustificativaDto,
  ): Promise<Justificativa> {
    const justificativa = await this.justificativaRepository.findOne({
      where: { id: justificativaId },
      relations: ['registroPonto'],
    });

    if (!justificativa) {
      throw new NotFoundException('Justificativa não encontrada');
    }

    // Atualizar justificativa
    justificativa.status = dados.status;
    justificativa.aprovadoPor = aprovadorId;
    justificativa.dataAprovacao = new Date();
    if (dados.observacoes) {
      justificativa.observacoes = dados.observacoes;
    }

    // Atualizar registro de ponto
    const novoStatus =
      dados.status === StatusJustificativa.APROVADA
        ? StatusRegistro.JUSTIFICADO
        : StatusRegistro.REJEITADO;

    await this.registroPontoRepository.update(justificativa.registroPontoId, {
      status: novoStatus,
      temJustificativaPendente: false,
    });

    return this.justificativaRepository.save(justificativa);
  }

  async rejeitarJustificativa(
    justificativaId: string,
    aprovadorId: string,
    dados: RejeitarJustificativaDto,
  ): Promise<Justificativa> {
    const justificativa = await this.justificativaRepository.findOne({
      where: { id: justificativaId },
      relations: ['registroPonto'],
    });

    if (!justificativa) {
      throw new NotFoundException('Justificativa não encontrada');
    }

    // Atualizar justificativa
    justificativa.status = StatusJustificativa.REJEITADA;
    justificativa.aprovadoPor = aprovadorId;
    justificativa.dataAprovacao = new Date();
    justificativa.observacoes = `Rejeitada: ${dados.motivoRejeicao}`;

    // Atualizar registro de ponto
    await this.registroPontoRepository.update(justificativa.registroPontoId, {
      status: StatusRegistro.REJEITADO,
      temJustificativaPendente: false,
    });

    return this.justificativaRepository.save(justificativa);
  }

  async buscarJustificativasPendentes(
    empresaId: string,
  ): Promise<Justificativa[]> {
    return this.justificativaRepository
      .createQueryBuilder('justificativa')
      .leftJoinAndSelect('justificativa.registroPonto', 'registro')
      .leftJoinAndSelect('registro.usuario', 'usuario')
      .leftJoinAndSelect('usuario.empresa', 'empresa')
      .where('empresa.id = :empresaId', { empresaId })
      .andWhere('justificativa.status = :status', {
        status: StatusJustificativa.PENDENTE,
      })
      .orderBy('justificativa.createdAt', 'DESC')
      .getMany();
  }

  async buscarJustificativasPorUsuario(
    usuarioId: string,
  ): Promise<Justificativa[]> {
    return this.justificativaRepository
      .createQueryBuilder('justificativa')
      .leftJoinAndSelect('justificativa.registroPonto', 'registro')
      .where('registro.usuarioId = :usuarioId', { usuarioId })
      .orderBy('justificativa.createdAt', 'DESC')
      .getMany();
  }

  async buscarJustificativaPorId(id: string): Promise<Justificativa> {
    const justificativa = await this.justificativaRepository.findOne({
      where: { id },
      relations: ['registroPonto', 'registroPonto.usuario', 'aprovador'],
    });

    if (!justificativa) {
      throw new NotFoundException('Justificativa não encontrada');
    }

    return justificativa;
  }

  async buscarTodasJustificativas(empresaId: string): Promise<Justificativa[]> {
    return this.justificativaRepository
      .createQueryBuilder('justificativa')
      .leftJoinAndSelect('justificativa.registroPonto', 'registro')
      .leftJoinAndSelect('registro.usuario', 'usuario')
      .leftJoinAndSelect('usuario.empresa', 'empresa')
      .where('empresa.id = :empresaId', { empresaId })
      .orderBy('justificativa.createdAt', 'DESC')
      .getMany();
  }

  async buscarEstatisticas(empresaId: string) {
    const [total, pendentes, aprovadas, rejeitadas] = await Promise.all([
      this.justificativaRepository
        .createQueryBuilder('justificativa')
        .leftJoin('justificativa.registroPonto', 'registro')
        .leftJoin('registro.usuario', 'usuario')
        .leftJoin('usuario.empresa', 'empresa')
        .where('empresa.id = :empresaId', { empresaId })
        .getCount(),
      this.justificativaRepository
        .createQueryBuilder('justificativa')
        .leftJoin('justificativa.registroPonto', 'registro')
        .leftJoin('registro.usuario', 'usuario')
        .leftJoin('usuario.empresa', 'empresa')
        .where('empresa.id = :empresaId', { empresaId })
        .andWhere('justificativa.status = :status', {
          status: StatusJustificativa.PENDENTE,
        })
        .getCount(),
      this.justificativaRepository
        .createQueryBuilder('justificativa')
        .leftJoin('justificativa.registroPonto', 'registro')
        .leftJoin('registro.usuario', 'usuario')
        .leftJoin('usuario.empresa', 'empresa')
        .where('empresa.id = :empresaId', { empresaId })
        .andWhere('justificativa.status = :status', {
          status: StatusJustificativa.APROVADA,
        })
        .getCount(),
      this.justificativaRepository
        .createQueryBuilder('justificativa')
        .leftJoin('justificativa.registroPonto', 'registro')
        .leftJoin('registro.usuario', 'usuario')
        .leftJoin('usuario.empresa', 'empresa')
        .where('empresa.id = :empresaId', { empresaId })
        .andWhere('justificativa.status = :status', {
          status: StatusJustificativa.REJEITADA,
        })
        .getCount(),
    ]);

    return {
      total,
      pendentes,
      aprovadas,
      rejeitadas,
    };
  }
}
