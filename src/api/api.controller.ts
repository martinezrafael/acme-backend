import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { NotificarDto } from './dto/notificar.dto';
import { NotificationsProducer } from '../notifications/notifications.producer';

@Controller('api')
export class ApiController {
  constructor(private readonly producer: NotificationsProducer) {}

  @Post('notificar')
  @HttpCode(HttpStatus.CREATED)
  async notificar(@Body() dto: NotificarDto) {
    await this.producer.emitUserCreated({
      userId: dto.mensagemId,
      tenantId: 't1',
      message: dto.conteudoMensagem,
    });
    return { ok: true };
  }
}
