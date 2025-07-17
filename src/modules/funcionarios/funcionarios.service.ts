import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateFuncionarioDto, UpdateFuncionarioDto } from './dto';
import { Funcionario } from './entities/funcionario.entity';

@Injectable()
export class FuncionariosService {
  constructor(
    @InjectRepository(Funcionario)
    private readonly funcionarioRepository: Repository<Funcionario>,
  ) {}

  async create(createFuncionarioDto: CreateFuncionarioDto): Promise<Funcionario> {
    try {
      // Verificar se CPF já existe
      const existingCpf = await this.funcionarioRepository.findOne({
        where: { cpf: createFuncionarioDto.cpf }
      });
      
      if (existingCpf) {
        throw new BadRequestException('CPF já cadastrado');
      }

      // Verificar se email já existe
      const existingEmail = await this.funcionarioRepository.findOne({
        where: { email: createFuncionarioDto.email }
      });
      
      if (existingEmail) {
        throw new BadRequestException('Email já cadastrado');
      }

      const funcionario = this.funcionarioRepository.create({
        ...createFuncionarioDto,
        dataAdmissao: new Date(createFuncionarioDto.dataAdmissao),
        ativo: createFuncionarioDto.ativo ?? true,
      });

      return await this.funcionarioRepository.save(funcionario);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Erro ao criar funcionário');
    }
  }

  async findAll(page = 1, limit = 10, ativo?: boolean): Promise<{
    data: Funcionario[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    
    const where = ativo !== undefined ? { ativo } : {};
    
    const [funcionarios, total] = await this.funcionarioRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { nome: 'ASC' }
    });

    return {
      data: funcionarios,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findOne(id: string): Promise<Funcionario> {
    const funcionario = await this.funcionarioRepository.findOne({
      where: { id }
    });

    if (!funcionario) {
      throw new NotFoundException('Funcionário não encontrado');
    }

    return funcionario;
  }

  async findByCpf(cpf: string): Promise<Funcionario> {
    const funcionario = await this.funcionarioRepository.findOne({
      where: { cpf }
    });

    if (!funcionario) {
      throw new NotFoundException('Funcionário não encontrado');
    }

    return funcionario;
  }

  async findByEmail(email: string): Promise<Funcionario> {
    const funcionario = await this.funcionarioRepository.findOne({
      where: { email }
    });

    if (!funcionario) {
      throw new NotFoundException('Funcionário não encontrado');
    }

    return funcionario;
  }

  async update(id: string, updateFuncionarioDto: UpdateFuncionarioDto): Promise<Funcionario> {
    const funcionario = await this.findOne(id);

    // Verificar se CPF já existe em outro funcionário
    if (updateFuncionarioDto.cpf && updateFuncionarioDto.cpf !== funcionario.cpf) {
      const existingCpf = await this.funcionarioRepository.findOne({
        where: { cpf: updateFuncionarioDto.cpf }
      });
      
      if (existingCpf && existingCpf.id !== id) {
        throw new BadRequestException('CPF já cadastrado para outro funcionário');
      }
    }

    // Verificar se email já existe em outro funcionário
    if (updateFuncionarioDto.email && updateFuncionarioDto.email !== funcionario.email) {
      const existingEmail = await this.funcionarioRepository.findOne({
        where: { email: updateFuncionarioDto.email }
      });
      
      if (existingEmail && existingEmail.id !== id) {
        throw new BadRequestException('Email já cadastrado para outro funcionário');
      }
    }

    // Converter dataAdmissao se fornecida
    const updateData = {
      ...updateFuncionarioDto,
      ...(updateFuncionarioDto.dataAdmissao && {
        dataAdmissao: new Date(updateFuncionarioDto.dataAdmissao)
      })
    };

    Object.assign(funcionario, updateData);
    
    return await this.funcionarioRepository.save(funcionario);
  }

  async remove(id: string): Promise<void> {
    const funcionario = await this.findOne(id);
    await this.funcionarioRepository.remove(funcionario);
  }

  async deactivate(id: string): Promise<Funcionario> {
    const funcionario = await this.findOne(id);
    funcionario.ativo = false;
    return await this.funcionarioRepository.save(funcionario);
  }

  async activate(id: string): Promise<Funcionario> {
    const funcionario = await this.findOne(id);
    funcionario.ativo = true;
    return await this.funcionarioRepository.save(funcionario);
  }

  async findByDepartamento(departamento: string, ativo = true): Promise<Funcionario[]> {
    return await this.funcionarioRepository.find({
      where: { departamento, ativo },
      order: { nome: 'ASC' }
    });
  }

  async findByCargo(cargo: string, ativo = true): Promise<Funcionario[]> {
    return await this.funcionarioRepository.find({
      where: { cargo, ativo },
      order: { nome: 'ASC' }
    });
  }

  async countByDepartamento(): Promise<{ departamento: string; total: number }[]> {
    const result = await this.funcionarioRepository
      .createQueryBuilder('funcionario')
      .select('funcionario.departamento', 'departamento')
      .addSelect('COUNT(*)', 'total')
      .where('funcionario.ativo = :ativo', { ativo: true })
      .groupBy('funcionario.departamento')
      .orderBy('total', 'DESC')
      .getRawMany();

    return result.map(item => ({
      departamento: item.departamento,
      total: parseInt(item.total)
    }));
  }

  async countByCargo(): Promise<{ cargo: string; total: number }[]> {
    const result = await this.funcionarioRepository
      .createQueryBuilder('funcionario')
      .select('funcionario.cargo', 'cargo')
      .addSelect('COUNT(*)', 'total')
      .where('funcionario.ativo = :ativo', { ativo: true })
      .groupBy('funcionario.cargo')
      .orderBy('total', 'DESC')
      .getRawMany();

    return result.map(item => ({
      cargo: item.cargo,
      total: parseInt(item.total)
    }));
  }
} 