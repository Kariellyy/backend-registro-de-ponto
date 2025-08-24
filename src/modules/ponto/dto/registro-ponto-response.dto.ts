import { TipoRegistro, StatusRegistro } from '../entities/registro-ponto.entity';

export class RegistroPontoResponseDto {
  id: string;
  tipo: TipoRegistro;
  status: StatusRegistro;
  dataHora: Date;
  latitude?: number;
  longitude?: number;
  dentroDoRaio: boolean;
  observacoes?: string;
  createdAt: Date;
  usuario: {
    id: string;
    nome: string;
    email: string;
  };
}
