import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CargosService } from './cargos.service';

@Controller('cargos')
@UseGuards(JwtAuthGuard)
export class CargosController {
  constructor(private readonly cargosService: CargosService) {}

  @Get()
  findAll(@Query('departamentoId') departamentoId?: string) {
    return this.cargosService.findAll(departamentoId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cargosService.findOne(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.cargosService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.cargosService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cargosService.remove(id);
  }
}


