import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { NotificarDto } from './dto/notificar.dto';
import { NotificationsProducer } from '../notifications/notifications.producer';

@Controller('api')
export class ApiController {
  constructor(private readonly producer: NotificationsProducer) {}

  @Post('notificar')
  @HttpCode(HttpStatus.ACCEPTED)
  async notificar(@Body() dto: NotificarDto) {
    try {
      await this.producer.publicarEntrada({
        mensagemId: dto.mensagemId,
        conteudoMensagem: dto.conteudoMensagem,
      });
      return { status: 'accepted', mensagemId: dto.mensagemId };
    } catch {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        status: 'failed_to_enqueue',
        mensagemId: dto.mensagemId,
      };
    }
  }
}
