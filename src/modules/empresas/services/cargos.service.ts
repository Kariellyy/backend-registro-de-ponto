import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cargo } from '../entities/cargo.entity';

@Injectable()
export class CargosService {
  constructor(
    @InjectRepository(Cargo) private readonly cargoRepo: Repository<Cargo>,
  ) {}

  async findAll(departamentoId?: string): Promise<Cargo[]> {
    if (departamentoId) {
      return this.cargoRepo.find({ where: { departamentoId } });
    }
    return this.cargoRepo.find();
  }

  async findOne(id: string): Promise<Cargo> {
    const cargo = await this.cargoRepo.findOne({ where: { id } });
    if (!cargo) throw new NotFoundException('Cargo não encontrado');
    return cargo;
  }

  async create(data: Partial<Cargo>): Promise<Cargo> {
    const cargo = this.cargoRepo.create(data);
    return this.cargoRepo.save(cargo);
  }

  async update(id: string, data: Partial<Cargo>): Promise<Cargo> {
    const cargo = await this.findOne(id);
    Object.assign(cargo, data);
    return this.cargoRepo.save(cargo);
  }

  async remove(id: string): Promise<void> {
    const cargo = await this.findOne(id);
    await this.cargoRepo.remove(cargo);
  }
}
