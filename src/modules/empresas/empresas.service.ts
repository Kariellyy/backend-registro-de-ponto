import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { Empresa } from './entities/empresa.entity';

@Injectable()
export class EmpresasService {
  constructor(
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
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

    const empresa = this.empresaRepository.create(createEmpresaDto);
    return await this.empresaRepository.save(empresa);
  }

  async findOne(id: string): Promise<Empresa> {
    const empresa = await this.empresaRepository.findOne({
      where: { id },
      relations: ['usuarios'],
    });

    if (!empresa) {
      throw new NotFoundException(`Empresa com ID ${id} não encontrada`);
    }
    return empresa;
  }

  async update(
    id: string,
    updateEmpresaDto: UpdateEmpresaDto,
  ): Promise<Empresa> {
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

    Object.assign(empresa, updateEmpresaDto);
    return await this.empresaRepository.save(empresa);
  }

  async remove(id: string): Promise<void> {
    const empresa = await this.findOne(id);
    await this.empresaRepository.remove(empresa);
  }
}
