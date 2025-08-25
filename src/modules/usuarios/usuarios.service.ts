import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { In, Repository } from 'typeorm';
import { Departamento } from '../empresas/entities/departamento.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { HorarioFuncionario } from './entities/horario-funcionario.entity';
import { Usuario } from './entities/usuario.entity';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Departamento)
    private readonly departamentoRepository: Repository<Departamento>,
    @InjectRepository(HorarioFuncionario)
    private readonly horarioFuncionarioRepository: Repository<HorarioFuncionario>,
  ) {}

  async create(createUsuarioDto: CreateUsuarioDto): Promise<Usuario> {
    // Verificar se email já existe
    const existingUser = await this.usuarioRepository.findOne({
      where: { email: createUsuarioDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    // Verificar se o departamento existe e pertence à mesma empresa
    if (createUsuarioDto.departamentoId) {
      const departamento = await this.departamentoRepository.findOne({
        where: { id: createUsuarioDto.departamentoId },
      });

      if (!departamento) {
        throw new BadRequestException('Departamento não encontrado');
      }

      if (departamento.empresaId !== createUsuarioDto.empresaId) {
        throw new BadRequestException('Departamento não pertence à empresa');
      }
    }

    // Determinar a senha: usar CPF se não for fornecida
    let passwordToUse = createUsuarioDto.password;
    if (!passwordToUse && createUsuarioDto.cpf) {
      // Remover formatação do CPF para usar como senha
      passwordToUse = createUsuarioDto.cpf.replace(/\D/g, '');
    } else if (!passwordToUse) {
      throw new BadRequestException(
        'Senha é obrigatória ou CPF deve ser fornecido',
      );
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(passwordToUse, 10);

    const usuario = this.usuarioRepository.create({
      ...createUsuarioDto,
      password: hashedPassword,
    });

    return await this.usuarioRepository.save(usuario);
  }

  async findOne(id: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id },
      relations: ['empresa', 'departamento', 'horarios'],
      select: [
        'id',
        'nome',
        'email',
        'telefone',
        'photoUrl',
        'cpf',
        'cargo',
        'departamentoId',
        'dataAdmissao',
        'papel',
        'status',
        'empresaId',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!usuario) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }

    // Ordenar horários por dia da semana
    if (usuario.horarios) {
      usuario.horarios.sort((a, b) => a.diaSemana - b.diaSemana);
    }

    return usuario;
  }

  async findByEmail(email: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({
      where: { email },
      relations: ['empresa', 'departamento', 'horarios'],
    });

    if (!usuario) {
      throw new NotFoundException(`Usuário com email ${email} não encontrado`);
    }

    // Ordenar horários por dia da semana
    if (usuario.horarios) {
      usuario.horarios.sort((a, b) => a.diaSemana - b.diaSemana);
    }

    return usuario;
  }

  async findByEmailWithPassword(email: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({
      where: { email },
      relations: ['empresa', 'departamento', 'horarios'],
      select: [
        'id',
        'nome',
        'email',
        'password',
        'telefone',
        'photoUrl',
        'papel',
        'status',
        'empresaId',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!usuario) {
      throw new NotFoundException(`Usuário com email ${email} não encontrado`);
    }

    // Ordenar horários por dia da semana
    if (usuario.horarios) {
      usuario.horarios.sort((a, b) => a.diaSemana - b.diaSemana);
    }

    return usuario;
  }

  async update(
    id: string,
    updateUsuarioDto: UpdateUsuarioDto,
  ): Promise<Usuario> {
    const usuario = await this.findOne(id);

    if (updateUsuarioDto.password) {
      updateUsuarioDto.password = await bcrypt.hash(
        updateUsuarioDto.password,
        10,
      );
    }

    Object.assign(usuario, updateUsuarioDto);
    return await this.usuarioRepository.save(usuario);
  }

  async remove(id: string): Promise<void> {
    const usuario = await this.findOne(id);
    await this.usuarioRepository.remove(usuario);
  }

  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  async findByEmpresa(empresaId: string): Promise<Usuario[]> {
    const usuarios = await this.usuarioRepository.find({
      where: {
        empresaId,
        papel: In(['administrador', 'funcionario']), // Excluir donos da empresa
      },
      relations: ['empresa', 'departamento', 'horarios'],
      select: [
        'id',
        'nome',
        'email',
        'telefone',
        'photoUrl',
        'cpf',
        'cargo',
        'departamentoId',
        'dataAdmissao',
        'papel',
        'status',
        'empresaId',
        'createdAt',
        'updatedAt',
      ],
      order: {
        nome: 'ASC', // Ordenar por nome alfabeticamente
      },
    });

    // Ordenar horários por dia da semana para cada usuário
    usuarios.forEach((usuario) => {
      if (usuario.horarios) {
        usuario.horarios.sort((a, b) => a.diaSemana - b.diaSemana);
      }
    });

    return usuarios;
  }

  async findFuncionariosByEmpresa(empresaId: string): Promise<Usuario[]> {
    const usuarios = await this.usuarioRepository.find({
      where: {
        empresaId,
        papel: 'funcionario' as any, // Apenas funcionários
      },
      relations: ['empresa', 'departamento', 'horarios'],
      select: [
        'id',
        'nome',
        'email',
        'telefone',
        'photoUrl',
        'cpf',
        'cargo',
        'departamentoId',
        'dataAdmissao',
        'papel',
        'status',
        'empresaId',
        'createdAt',
        'updatedAt',
      ],
      order: {
        nome: 'ASC',
      },
    });

    // Ordenar horários por dia da semana para cada usuário
    usuarios.forEach((usuario) => {
      if (usuario.horarios) {
        usuario.horarios.sort((a, b) => a.diaSemana - b.diaSemana);
      }
    });

    return usuarios;
  }
}
