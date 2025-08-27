import { Controller, Logger } from '@nestjs/common';
import {
  MessagePattern,
  EventPattern,
  Payload,
  Ctx,
  RmqContext,
} from '@nestjs/microservices';
import { Channel, ConsumeMessage } from 'amqplib';
import { RABBITMQ_PATTERNS } from '../messaging/rabbitmq.constants';
import { NotificationsProducer } from './notifications.producer';
import { StatusService } from './status.service';
import { ConfigService } from '@nestjs/config';

@Controller()
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(
    private readonly producer: NotificationsProducer,
    private readonly statusService: StatusService,
    private readonly config: ConfigService,
  ) {}

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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error('Erro ao processar notificação', error?.stack || error);
      channel.nack(msg, false, false); // DLQ se configurado
    }
  }

  @EventPattern(process.env.RABBITMQ_QUEUE || 'fila.notificacao.entrada.rafael')
  async consumirEntrada(
    @Payload() data: { mensagemId: string; conteudoMensagem: string },
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef() as Channel;
    const msg = context.getMessage() as ConsumeMessage;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const corrId =
      msg.properties.messageId ??
      (typeof msg.properties.headers?.['x-correlation-id'] === 'string'
        ? msg.properties.headers['x-correlation-id']
        : undefined);

    const statusCode = this.config.get<number>('STATUS_CODE') ?? 200;
    try {
      this.logger.log(
        `Entrada recebida: id=${data.mensagemId} key=${msg.fields.routingKey} corrId=${corrId}`,
      );

      const delay = 1000 + Math.random() * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));

      const sorteio = 1 + Math.floor(Math.random() * 10);
      const status =
        sorteio <= 2 ? 'FALHA_PROCESSAMENTO' : 'PROCESSADO_SUCESSO';

      this.statusService.setStatus(data.mensagemId, status, statusCode);

      await this.producer.publicarStatus({
        mensagemId: data.mensagemId,
        status,
        statusCode,
      });

      this.logger.log(
        `Status publicado: id=${data.mensagemId} status=${status} sorteio=${sorteio} (~${Math.round(
          delay,
        )}ms)`,
      );

      channel.ack(msg);
    } catch (error: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error('Erro ao processar entrada', error?.stack || error);

      const status = 'FALHA_PROCESSAMENTO';
      this.statusService.setStatus(data.mensagemId, status, statusCode);
      try {
        await this.producer.publicarStatus({
          mensagemId: data.mensagemId,
          status,
          statusCode,
        });
      } catch (pubErr) {
        this.logger.error('Falha ao publicar status', pubErr);
      }

      channel.ack(msg);
    }
  }
}
