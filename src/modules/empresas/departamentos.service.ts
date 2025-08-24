import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../usuarios/entities/usuario.entity';
import { CreateDepartamentoDto } from './dto/create-departamento.dto';
import { UpdateDepartamentoDto } from './dto/update-departamento.dto';
import { Departamento } from './entities/departamento.entity';

@Injectable()
export class DepartamentosService {
  constructor(
    @InjectRepository(Departamento)
    private readonly departamentoRepository: Repository<Departamento>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  async create(
    empresaId: string,
    createDepartamentoDto: CreateDepartamentoDto,
  ): Promise<Departamento> {
    // Verificar se já existe um departamento com o mesmo nome na empresa
    const existingDepartamento = await this.departamentoRepository.findOne({
      where: {
        empresaId,
        nome: createDepartamentoDto.nome,
      },
    });

    if (existingDepartamento) {
      throw new ConflictException(
        'Já existe um departamento com este nome na empresa',
      );
    }

    const departamento = this.departamentoRepository.create({
      ...createDepartamentoDto,
      empresaId,
    });

    return await this.departamentoRepository.save(departamento);
  }

  async findAllByEmpresa(empresaId: string): Promise<Departamento[]> {
    return await this.departamentoRepository.find({
      where: { empresaId },
      relations: ['usuarios'],
      order: { nome: 'ASC' },
    });
  }

  async findOne(id: string, empresaId: string): Promise<Departamento> {
    const departamento = await this.departamentoRepository.findOne({
      where: { id, empresaId },
      relations: ['usuarios'],
    });

    if (!departamento) {
      throw new NotFoundException(`Departamento com ID ${id} não encontrado`);
    }

    return departamento;
  }

  async update(
    id: string,
    empresaId: string,
    updateDepartamentoDto: UpdateDepartamentoDto,
  ): Promise<Departamento> {
    const departamento = await this.findOne(id, empresaId);

    // Se o nome foi alterado, verificar se já existe outro departamento com o mesmo nome
    if (
      updateDepartamentoDto.nome &&
      updateDepartamentoDto.nome !== departamento.nome
    ) {
      const existingDepartamento = await this.departamentoRepository.findOne({
        where: {
          empresaId,
          nome: updateDepartamentoDto.nome,
          id: { $ne: id } as any, // Excluir o próprio departamento da busca
        },
      });

      if (existingDepartamento) {
        throw new ConflictException(
          'Já existe um departamento com este nome na empresa',
        );
      }
    }

    Object.assign(departamento, updateDepartamentoDto);
    return await this.departamentoRepository.save(departamento);
  }

  async remove(id: string, empresaId: string): Promise<void> {
    const departamento = await this.findOne(id, empresaId);
    await this.departamentoRepository.remove(departamento);
  }

  async checkIfDepartamentoHasUsers(
    id: string,
    empresaId: string,
  ): Promise<boolean> {
    const count = await this.usuarioRepository.count({
      where: {
        departamentoId: id,
        empresaId,
      },
    });

    return count > 0;
  }
}
