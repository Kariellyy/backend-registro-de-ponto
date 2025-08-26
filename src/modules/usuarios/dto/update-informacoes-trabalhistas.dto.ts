import { PartialType } from '@nestjs/mapped-types';
import { CreateInformacoesTrabalhistasDto } from './create-informacoes-trabalhistas.dto';

export class UpdateInformacoesTrabalhistasDto extends PartialType(
  CreateInformacoesTrabalhistasDto,
) {}
