import { IsString, IsUUID, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class NotificarDto {
  @IsUUID()
  mensagemId!: string;

  @IsString()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MinLength(1, { message: 'conteudo Mensagem não pode ser vazio' })
  conteudoMensagem!: string;
}
