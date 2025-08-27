import { StatusFalta, TipoFalta } from '../entities/falta.entity';

export class FaltaResponseDto {
  id: string;
  usuarioId: string;
  data: string;
  tipo: TipoFalta;
  status: StatusFalta;
  motivo?: string;
  observacoes?: string;
  horarioInicioEfetivo?: string;
  horarioFimEfetivo?: string;
  minutosAtraso?: number;
  minutosSaidaAntecipada?: number;
  aprovadoPor?: string;
  dataAprovacao?: string;
  createdAt: string;
  updatedAt: string;
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
