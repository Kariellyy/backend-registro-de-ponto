import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEmpresaDto } from '../dto/create-empresa.dto';
import { CreateHorarioEmpresaDto } from '../dto/horario-empresa.dto';
import { UpdateEmpresaDto } from '../dto/update-empresa.dto';
import { Empresa } from '../entities/empresa.entity';
import { HorarioEmpresa } from '../entities/horario-empresa.entity';

@Injectable()
export class EmpresasService {
  constructor(
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
    @InjectRepository(HorarioEmpresa)
    private readonly horarioEmpresaRepository: Repository<HorarioEmpresa>,
  ) {}

  async create(createEmpresaDto: CreateEmpresaDto): Promise<Empresa> {
    // Verificar se CNPJ já existe
    const existingEmpresa = await this.empresaRepository.findOne({
      where: { cnpj: createEmpresaDto.cnpj },
    });

    if (existingEmpresa) {
      throw new ConflictException('CNPJ já está em uso');
    }

    // Verificar se email já existe
    const existingEmail = await this.empresaRepository.findOne({
      where: { email: createEmpresaDto.email },
    });

    if (existingEmail) {
      throw new ConflictException('Email já está em uso');
    }

    const { horarios, ...empresaData } = createEmpresaDto;
    const empresa = this.empresaRepository.create(empresaData);
    const savedEmpresa = await this.empresaRepository.save(empresa);

    // Criar horários padrão se não foram fornecidos
    if (horarios && horarios.length > 0) {
      await this.createHorarios(savedEmpresa.id, horarios);
    } else {
      await this.createHorariosPadrao(savedEmpresa.id);
    }

    return this.findOne(savedEmpresa.id);
  }

  async findOne(id: string): Promise<Empresa> {
    const empresa = await this.empresaRepository.findOne({
      where: { id },
      relations: ['usuarios', 'horarios'],
    });

    if (!empresa) {
      throw new NotFoundException(`Empresa com ID ${id} não encontrada`);
    }

    // Ordenar horários por dia da semana
    if (empresa.horarios) {
      empresa.horarios.sort((a, b) => a.diaSemana - b.diaSemana);
    }

    return empresa;
  }

  async update(
    id: string,
    updateEmpresaDto: UpdateEmpresaDto,
  ): Promise<Empresa> {
    console.log(
      'EmpresasService.update - Dados recebidos:',
      JSON.stringify(updateEmpresaDto, null, 2),
    );

    const empresa = await this.findOne(id);

    // Verificar se CNPJ já existe (se foi alterado)
    if (updateEmpresaDto.cnpj && updateEmpresaDto.cnpj !== empresa.cnpj) {
      const existingEmpresa = await this.empresaRepository.findOne({
        where: { cnpj: updateEmpresaDto.cnpj },
      });

      if (existingEmpresa) {
        throw new ConflictException('CNPJ já está em uso');
      }
    }

    // Verificar se email já existe (se foi alterado)
    if (updateEmpresaDto.email && updateEmpresaDto.email !== empresa.email) {
      const existingEmail = await this.empresaRepository.findOne({
        where: { email: updateEmpresaDto.email },
      });

      if (existingEmail) {
        throw new ConflictException('Email já está em uso');
      }
    }

    const { horarios, ...empresaData } = updateEmpresaDto;

    // Atualizar dados básicos da empresa
    Object.assign(empresa, empresaData);
    await this.empresaRepository.save(empresa);

    // Atualizar horários se fornecidos
    if (horarios && horarios.length > 0) {
      console.log('Atualizando horários...');
      // Remover horários existentes
      await this.horarioEmpresaRepository.delete({ empresaId: id });
      // Criar novos horários
      await this.createHorarios(id, horarios);
    }

    const updatedEmpresa = await this.findOne(id);
    console.log(
      'EmpresasService.update - Empresa atualizada com horários:',
      updatedEmpresa.horarios?.length,
    );

    return updatedEmpresa;
  }

  async remove(id: string): Promise<void> {
    const empresa = await this.findOne(id);
    await this.empresaRepository.remove(empresa);
  }

  private async createHorarios(
    empresaId: string,
    horariosData: CreateHorarioEmpresaDto[],
  ): Promise<void> {
    const horarios: HorarioEmpresa[] = [];

    for (const horario of horariosData) {
      const novoHorario = new HorarioEmpresa();
      novoHorario.diaSemana = horario.diaSemana;
      novoHorario.ativo = horario.ativo;
      novoHorario.horarioInicio = horario.horarioInicio || null;
      novoHorario.horarioFim = horario.horarioFim || null;
      novoHorario.temIntervalo = horario.temIntervalo;
      novoHorario.intervaloInicio = horario.temIntervalo
        ? horario.intervaloInicio || null
        : null;
      novoHorario.intervaloFim = horario.temIntervalo
        ? horario.intervaloFim || null
        : null;
      novoHorario.empresaId = empresaId;

      horarios.push(novoHorario);
    }

    await this.horarioEmpresaRepository.save(horarios);
    console.log(
      `Criados ${horarios.length} horários para empresa ${empresaId}`,
    );
  }

  private async createHorariosPadrao(empresaId: string): Promise<void> {
    const horariosPadrao: CreateHorarioEmpresaDto[] = [
      {
        diaSemana: 0,
        ativo: false,
        horarioInicio: '',
        horarioFim: '',
        temIntervalo: false,
      },
      {
        diaSemana: 1,
        ativo: true,
        horarioInicio: '08:00',
        horarioFim: '18:00',
        temIntervalo: false,
      },
      {
        diaSemana: 2,
        ativo: true,
        horarioInicio: '08:00',
        horarioFim: '18:00',
        temIntervalo: false,
      },
      {
        diaSemana: 3,
        ativo: true,
        horarioInicio: '08:00',
        horarioFim: '18:00',
        temIntervalo: false,
      },
      {
        diaSemana: 4,
        ativo: true,
        horarioInicio: '08:00',
        horarioFim: '18:00',
        temIntervalo: false,
      },
      {
        diaSemana: 5,
        ativo: true,
        horarioInicio: '08:00',
        horarioFim: '18:00',
        temIntervalo: false,
      },
      {
        diaSemana: 6,
        ativo: true,
        horarioInicio: '08:00',
        horarioFim: '12:00',
        temIntervalo: false,
      },
    ];

    await this.createHorarios(empresaId, horariosPadrao);
  }
}
