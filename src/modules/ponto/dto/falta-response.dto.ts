import { StatusFalta, TipoFalta } from '../entities/falta.entity';

export class FaltaResponseDto {
  id: string;
  usuarioId: string;
  data: Date;
  tipo: TipoFalta;
  status: StatusFalta;
  motivo?: string;
  observacoes?: string;
  horarioInicioEfetivo?: string;
  horarioFimEfetivo?: string;
  minutosAtraso?: number;
  minutosSaidaAntecipada?: number;
  aprovadoPor?: string;
  dataAprovacao?: Date;
  createdAt: Date;
  updatedAt: Date;
  usuario?: {
    id: string;
    nome: string;
    email: string;
  };
  aprovador?: {
    id: string;
    nome: string;
    email: string;
  };
}
