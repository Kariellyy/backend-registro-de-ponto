import { IsNotEmpty, IsString } from 'class-validator';

export class RejeitarJustificativaDto {
  @IsNotEmpty()
  @IsString()
  motivoRejeicao: string;
}
