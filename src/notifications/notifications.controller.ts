import { Controller, Logger } from '@nestjs/common';
import {
  MessagePattern,
  Payload,
  Ctx,
  RmqContext,
} from '@nestjs/microservices';
import { Channel, ConsumeMessage } from 'amqplib';
import { RABBITMQ_PATTERNS } from '../messaging/rabbitmq.constants';

@Controller()
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  @MessagePattern(RABBITMQ_PATTERNS.NOTIFICATIONS_INSPECT)
  inspect(@Payload() _data: unknown, @Ctx() context: RmqContext) {
    const pattern = context.getPattern();
    const msg = context.getMessage() as ConsumeMessage;

    this.logger.log(`Pattern: ${pattern}`);
    this.logger.log(`RoutingKey: ${msg.fields.routingKey}`);
    this.logger.log(`DeliveryTag: ${msg.fields.deliveryTag}`);
    this.logger.log(`Headers: ${JSON.stringify(msg.properties.headers ?? {})}`);
    this.logger.log(`CorrelationId: ${msg.properties.correlationId ?? '-'}`);

    try {
      const contentStr = msg.content?.toString?.() ?? '';
      this.logger.log(`Content: ${contentStr}`);
    } catch {
      this.logger.warn('Não foi possível converter o content para string.');
    }
  }

  // Exemplo com curinga: qualquer routing key que comece com "notifications."
  @MessagePattern(RABBITMQ_PATTERNS.NOTIFICATIONS_ANY)
  handleNotification(
    @Payload() data: { userId?: string; [k: string]: any },
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef() as Channel;
    const msg = context.getMessage() as ConsumeMessage;

    try {
      const headers = (msg.properties.headers ?? {}) as Record<string, any>;
      const version = headers['x-version'] as string;
      const tenantId = headers['x-tenant-id'] as string;
      const priority = msg.properties.priority as number;

      this.logger.log(
        `key=${msg.fields.routingKey} tenant=${tenantId} v=${version} prio=${priority} user=${data?.userId ?? '-'}`,
      );

      channel.ack(msg);
    } catch (error: any) {
      this.logger.error('Erro ao processar notificação', error || error);
      // DLQ se configurado
      channel.nack(msg, false, false);
    }
  }
}
