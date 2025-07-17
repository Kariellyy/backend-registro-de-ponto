import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseBoolPipe,
    ParseIntPipe,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateFuncionarioDto, UpdateFuncionarioDto } from './dto';
import { Funcionario } from './entities/funcionario.entity';
import { FuncionariosService } from './funcionarios.service';

@ApiTags('funcionarios')
@Controller('funcionarios')
export class FuncionariosController {
  constructor(private readonly funcionariosService: FuncionariosService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo funcionário' })
  @ApiResponse({ status: 201, description: 'Funcionário criado com sucesso', type: Funcionario })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async create(@Body() createFuncionarioDto: CreateFuncionarioDto): Promise<Funcionario> {
    return this.funcionariosService.create(createFuncionarioDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar funcionários com paginação' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 10)' })
  @ApiQuery({ name: 'ativo', required: false, type: Boolean, description: 'Filtrar por status ativo' })
  @ApiResponse({ status: 200, description: 'Lista de funcionários retornada com sucesso' })
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
    @Query('ativo', new ParseBoolPipe({ optional: true })) ativo?: boolean,
  ) {
    return this.funcionariosService.findAll(page, limit, ativo);
  }

  @Get('departamento/:departamento')
  @ApiOperation({ summary: 'Buscar funcionários por departamento' })
  @ApiParam({ name: 'departamento', description: 'Nome do departamento' })
  @ApiQuery({ name: 'ativo', required: false, type: Boolean, description: 'Filtrar por status ativo (padrão: true)' })
  @ApiResponse({ status: 200, description: 'Funcionários do departamento retornados com sucesso' })
  async findByDepartamento(
    @Param('departamento') departamento: string,
    @Query('ativo', new ParseBoolPipe({ optional: true })) ativo = true,
  ): Promise<Funcionario[]> {
    return this.funcionariosService.findByDepartamento(departamento, ativo);
  }

  @Get('cargo/:cargo')
  @ApiOperation({ summary: 'Buscar funcionários por cargo' })
  @ApiParam({ name: 'cargo', description: 'Nome do cargo' })
  @ApiQuery({ name: 'ativo', required: false, type: Boolean, description: 'Filtrar por status ativo (padrão: true)' })
  @ApiResponse({ status: 200, description: 'Funcionários do cargo retornados com sucesso' })
  async findByCargo(
    @Param('cargo') cargo: string,
    @Query('ativo', new ParseBoolPipe({ optional: true })) ativo = true,
  ): Promise<Funcionario[]> {
    return this.funcionariosService.findByCargo(cargo, ativo);
  }

  @Get('estatisticas/departamentos')
  @ApiOperation({ summary: 'Contar funcionários por departamento' })
  @ApiResponse({ status: 200, description: 'Estatísticas por departamento retornadas com sucesso' })
  async countByDepartamento(): Promise<{ departamento: string; total: number }[]> {
    return this.funcionariosService.countByDepartamento();
  }

  @Get('estatisticas/cargos')
  @ApiOperation({ summary: 'Contar funcionários por cargo' })
  @ApiResponse({ status: 200, description: 'Estatísticas por cargo retornadas com sucesso' })
  async countByCargo(): Promise<{ cargo: string; total: number }[]> {
    return this.funcionariosService.countByCargo();
  }

  @Get('cpf/:cpf')
  @ApiOperation({ summary: 'Buscar funcionário por CPF' })
  @ApiParam({ name: 'cpf', description: 'CPF do funcionário' })
  @ApiResponse({ status: 200, description: 'Funcionário encontrado', type: Funcionario })
  @ApiResponse({ status: 404, description: 'Funcionário não encontrado' })
  async findByCpf(@Param('cpf') cpf: string): Promise<Funcionario> {
    return this.funcionariosService.findByCpf(cpf);
  }

  @Get('email/:email')
  @ApiOperation({ summary: 'Buscar funcionário por email' })
  @ApiParam({ name: 'email', description: 'Email do funcionário' })
  @ApiResponse({ status: 200, description: 'Funcionário encontrado', type: Funcionario })
  @ApiResponse({ status: 404, description: 'Funcionário não encontrado' })
  async findByEmail(@Param('email') email: string): Promise<Funcionario> {
    return this.funcionariosService.findByEmail(email);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar funcionário por ID' })
  @ApiParam({ name: 'id', description: 'ID do funcionário (UUID)' })
  @ApiResponse({ status: 200, description: 'Funcionário encontrado', type: Funcionario })
  @ApiResponse({ status: 404, description: 'Funcionário não encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Funcionario> {
    return this.funcionariosService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar funcionário' })
  @ApiParam({ name: 'id', description: 'ID do funcionário (UUID)' })
  @ApiResponse({ status: 200, description: 'Funcionário atualizado com sucesso', type: Funcionario })
  @ApiResponse({ status: 404, description: 'Funcionário não encontrado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateFuncionarioDto: UpdateFuncionarioDto,
  ): Promise<Funcionario> {
    return this.funcionariosService.update(id, updateFuncionarioDto);
  }

  @Patch(':id/desativar')
  @ApiOperation({ summary: 'Desativar funcionário' })
  @ApiParam({ name: 'id', description: 'ID do funcionário (UUID)' })
  @ApiResponse({ status: 200, description: 'Funcionário desativado com sucesso', type: Funcionario })
  @ApiResponse({ status: 404, description: 'Funcionário não encontrado' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<Funcionario> {
    return this.funcionariosService.deactivate(id);
  }

  @Patch(':id/ativar')
  @ApiOperation({ summary: 'Ativar funcionário' })
  @ApiParam({ name: 'id', description: 'ID do funcionário (UUID)' })
  @ApiResponse({ status: 200, description: 'Funcionário ativado com sucesso', type: Funcionario })
  @ApiResponse({ status: 404, description: 'Funcionário não encontrado' })
  async activate(@Param('id', ParseUUIDPipe) id: string): Promise<Funcionario> {
    return this.funcionariosService.activate(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir funcionário permanentemente' })
  @ApiParam({ name: 'id', description: 'ID do funcionário (UUID)' })
  @ApiResponse({ status: 204, description: 'Funcionário excluído com sucesso' })
  @ApiResponse({ status: 404, description: 'Funcionário não encontrado' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.funcionariosService.remove(id);
  }
} 