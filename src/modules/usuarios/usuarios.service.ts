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
import { InformacoesTrabalhistas } from './entities/informacoes-trabalhistas.entity';
import { Usuario } from './entities/usuario.entity';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(InformacoesTrabalhistas)
    private readonly informacoesTrabalhistasRepository: Repository<InformacoesTrabalhistas>,
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

    // Separar dados do usuário e informações trabalhistas
    const {
      horariosFuncionario,
      cargoId,
      departamentoId,
      dataAdmissao,
      inicioRegistros,
      cargaHorariaSemanal,
      salario,
      ...usuarioData
    } = createUsuarioDto;

    const usuario = this.usuarioRepository.create({
      ...usuarioData,
      password: hashedPassword,
    });

    // Salvar o usuário primeiro
    const savedUsuario = await this.usuarioRepository.save(usuario);

    // Criar e salvar informações trabalhistas se houver dados trabalhistas completos
    if (cargoId && departamentoId && dataAdmissao && inicioRegistros) {
      const informacoesTrabalhistas =
        this.informacoesTrabalhistasRepository.create({
          usuarioId: savedUsuario.id,
          cargoId,
          departamentoId,
          dataAdmissao: new Date(dataAdmissao),
          inicioRegistros: new Date(inicioRegistros),
          cargaHorariaSemanal: cargaHorariaSemanal || 40,
          salario: salario || null,
        });

      await this.informacoesTrabalhistasRepository.save(
        informacoesTrabalhistas,
      );
    }

    // Processar e salvar os horários do funcionário
    if (horariosFuncionario) {
      const horariosToSave = Object.entries(horariosFuncionario).map(
        ([diaSemana, horario]) => {
          return this.horarioFuncionarioRepository.create({
            diaSemana: parseInt(diaSemana),
            ativo: horario.ativo,
            horarioInicio: horario.ativo ? horario.inicio : null,
            horarioFim: horario.ativo ? horario.fim : null,
            temIntervalo: horario.temIntervalo,
            intervaloInicio: horario.temIntervalo
              ? horario.intervaloInicio
              : null,
            intervaloFim: horario.temIntervalo ? horario.intervaloFim : null,
            usuarioId: savedUsuario.id,
          });
        },
      );

      await this.horarioFuncionarioRepository.save(horariosToSave);
    }

    // Retornar o usuário com as informações trabalhistas e horários carregados
    return await this.findOne(savedUsuario.id);
  }

  async findOne(id: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id },
      relations: [
        'empresa',
        'informacoesTrabalhistas',
        'informacoesTrabalhistas.departamento',
        'informacoesTrabalhistas.cargo',
        'horarios',
      ],
      select: [
        'id',
        'nome',
        'email',
        'telefone',
        'photoUrl',
        'cpf',
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
      relations: [
        'empresa',
        'informacoesTrabalhistas',
        'informacoesTrabalhistas.departamento',
        'informacoesTrabalhistas.cargo',
        'horarios',
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

  async findByEmailWithPassword(email: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({
      where: { email },
      relations: [
        'empresa',
        'informacoesTrabalhistas',
        'informacoesTrabalhistas.departamento',
        'informacoesTrabalhistas.cargo',
        'horarios',
      ],
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

    // Separar dados do usuário e informações trabalhistas
    const {
      horariosFuncionario,
      cargoId,
      departamentoId,
      dataAdmissao,
      inicioRegistros,
      cargaHorariaSemanal,
      salario,
      ...usuarioData
    } = updateUsuarioDto;

    // Atualizar dados do usuário
    Object.assign(usuario, usuarioData);
    const savedUsuario = await this.usuarioRepository.save(usuario);

    // Atualizar informações trabalhistas se houver dados trabalhistas
    if (
      cargoId !== undefined ||
      departamentoId !== undefined ||
      dataAdmissao !== undefined ||
      inicioRegistros !== undefined ||
      cargaHorariaSemanal !== undefined ||
      salario !== undefined
    ) {
      let informacoesTrabalhistas =
        await this.informacoesTrabalhistasRepository.findOne({
          where: { usuarioId: id },
        });

      if (!informacoesTrabalhistas) {
        // Criar nova se não existir - requer todos os campos obrigatórios
        if (cargoId && departamentoId && dataAdmissao && inicioRegistros) {
          informacoesTrabalhistas =
            this.informacoesTrabalhistasRepository.create({
              usuarioId: id,
              cargoId,
              departamentoId,
              dataAdmissao: new Date(dataAdmissao),
              inicioRegistros: new Date(inicioRegistros),
              cargaHorariaSemanal: cargaHorariaSemanal || 40,
              salario: salario || null,
            });
        } else {
          throw new BadRequestException(
            'Para criar informações trabalhistas são necessários: cargoId, departamentoId, dataAdmissao e inicioRegistros',
          );
        }
      } else {
        // Atualizar existente
        if (cargoId !== undefined) informacoesTrabalhistas.cargoId = cargoId;
        if (departamentoId !== undefined)
          informacoesTrabalhistas.departamentoId = departamentoId;
        if (dataAdmissao !== undefined)
          informacoesTrabalhistas.dataAdmissao = new Date(dataAdmissao);
        if (inicioRegistros !== undefined)
          informacoesTrabalhistas.inicioRegistros = new Date(inicioRegistros);
        if (cargaHorariaSemanal !== undefined)
          informacoesTrabalhistas.cargaHorariaSemanal = cargaHorariaSemanal;
        if (salario !== undefined) informacoesTrabalhistas.salario = salario;
      }

      await this.informacoesTrabalhistasRepository.save(
        informacoesTrabalhistas,
      );
    }

    // Processar e atualizar os horários do funcionário
    if (horariosFuncionario) {
      // Remover horários existentes
      await this.horarioFuncionarioRepository.delete({ usuarioId: id });

      // Salvar novos horários
      const horariosToSave = Object.entries(horariosFuncionario).map(
        ([diaSemana, horario]) => {
          return this.horarioFuncionarioRepository.create({
            diaSemana: parseInt(diaSemana),
            ativo: horario.ativo,
            horarioInicio: horario.ativo ? horario.inicio : null,
            horarioFim: horario.ativo ? horario.fim : null,
            temIntervalo: horario.temIntervalo,
            intervaloInicio: horario.temIntervalo
              ? horario.intervaloInicio
              : null,
            intervaloFim: horario.temIntervalo ? horario.intervaloFim : null,
            usuarioId: id,
          });
        },
      );

      await this.horarioFuncionarioRepository.save(horariosToSave);
    }

    // Retornar o usuário com as informações trabalhistas e horários carregados
    return await this.findOne(id);
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
      relations: [
        'empresa',
        'informacoesTrabalhistas',
        'informacoesTrabalhistas.departamento',
        'informacoesTrabalhistas.cargo',
        'horarios',
      ],
      select: [
        'id',
        'nome',
        'email',
        'telefone',
        'photoUrl',
        'cpf',
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
      relations: [
        'empresa',
        'informacoesTrabalhistas',
        'informacoesTrabalhistas.departamento',
        'informacoesTrabalhistas.cargo',
        'horarios',
      ],
      select: [
        'id',
        'nome',
        'email',
        'telefone',
        'photoUrl',
        'cpf',
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
