import {
  StatusRegistro,
  TipoRegistro,
} from '../entities/registro-ponto.entity';

export class RegistroPontoResponseDto {
  id: string;
  tipo: TipoRegistro;
  status: StatusRegistro;
  dataHora: Date;
  latitude?: number;
  longitude?: number;
  dentroDoRaio: boolean;
  observacoes?: string;
  temJustificativaPendente: boolean;
  createdAt: Date;
  mensagem?: string; // Mensagem informativa sobre o status
  usuario: {
    id: string;
    nome: string;
    email: string;
  };
}
