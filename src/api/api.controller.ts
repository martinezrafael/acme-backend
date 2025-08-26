import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { NotificarDto } from './dto/notificar.dto';
import { NotificationsProducer } from '../notifications/notifications.producer';

@Controller('api')
export class ApiController {
  constructor(private readonly producer: NotificationsProducer) {}

  @Post('notificar')
  @HttpCode(HttpStatus.ACCEPTED) // 202
  async notificar(@Body() dto: NotificarDto) {
    await this.producer.publicarEntrada({
      mensagemId: dto.mensagemId,
      conteudoMensagem: dto.conteudoMensagem,
    });

    // Retorna imediatamente (assíncrono), com o id para rastreio
    return {
      status: 'accepted',
      mensagemId: dto.mensagemId,
    };
  }
}
