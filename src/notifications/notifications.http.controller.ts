import { Body, Controller, Logger, Post } from '@nestjs/common';
import { NotificationsProducer } from './notifications.producer';

@Controller('notifications')
export class NotificationsHttpController {
  private readonly logger = new Logger(NotificationsHttpController.name);

  constructor(private readonly producer: NotificationsProducer) {}

  @Post('test-emit')
  async testEmit(
    @Body() body: { userId: string; tenantId?: string; message?: string },
  ) {
    await this.producer.emitUserCreated({
      userId: body.userId,
      tenantId: body.tenantId || 'tenant-demo',
      message: body.message || 'Hello!',
    });
    return { ok: true };
  }
}
