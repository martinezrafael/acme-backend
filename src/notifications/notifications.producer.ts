import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  ClientProxy,
  RmqRecordBuilder,
  RmqStatus,
} from '@nestjs/microservices';
import { lastValueFrom, Subscription } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import type { AmqpConnectionManager } from 'amqp-connection-manager';
import {
  RABBITMQ_CLIENTS,
  RABBITMQ_PATTERNS,
} from '../messaging/rabbitmq.constants';

@Injectable()
export class NotificationsProducer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsProducer.name);
  private statusSub?: Subscription;

  private readonly filaEntrada: string;
  private readonly filaStatus: string; // ← NOVO

  // driver real (amqp-connection-manager)
  private manager?: AmqpConnectionManager;
  private onDriverConnect = () => this.logger.log('RMQ driver: connect');
  private onDriverDisconnect = (params: unknown) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    this.logger.error('RMQ driver: disconnect', (params as any)?.err);

  constructor(
    @Inject(RABBITMQ_CLIENTS.NOTIFICATIONS)
    private readonly client: ClientProxy,
    private readonly cfg: ConfigService,
  ) {
    const entrada = this.cfg.get<string>('RABBITMQ_QUEUE');
    if (!entrada) throw new Error('RABBITMQ_QUEUE não definida no .env');
    this.filaEntrada = entrada;

    const status = this.cfg.get<string>('RABBITMQ_STATUS_QUEUE');
    if (!status) throw new Error('RABBITMQ_STATUS_QUEUE não definida no .env');
    this.filaStatus = status;
  }

  // conecta antes de unwrap()
  async onModuleInit() {
    this.statusSub = this.client.status.subscribe((s: RmqStatus) =>
      this.logger.log(`RMQ Client status: ${s}`),
    );

    await this.client.connect();

    this.manager = this.client.unwrap<AmqpConnectionManager>();
    this.manager.on('connect', this.onDriverConnect);
    this.manager.on('disconnect', this.onDriverDisconnect);
  }

  onModuleDestroy() {
    this.statusSub?.unsubscribe();
    // Remove listeners for cleanup
    this.manager?.removeListener?.('connect', this.onDriverConnect);
    this.manager?.removeListener?.('disconnect', this.onDriverDisconnect);
  }

  /** Publica na fila de ENTRADA (routing key = nome da fila) */
  async publicarEntrada(payload: {
    mensagemId: string;
    conteudoMensagem: string;
  }) {
    const record = new RmqRecordBuilder(payload)
      .setOptions({
        headers: {
          'x-version': '1.0.0',
          'x-correlation-id': payload.mensagemId,
        },
        priority: 5,
        messageId: payload.mensagemId,
      })
      .build();

    await lastValueFrom(this.client.emit(this.filaEntrada, record));
  }

  /** NOVO: publica status em fila.notificacao.status.[SEU-NOME] */
  async publicarStatus(payload: { mensagemId: string; status: string }) {
    const record = new RmqRecordBuilder(payload)
      .setOptions({
        headers: {
          'x-version': '1.0.0',
          'x-correlation-id': payload.mensagemId,
        },
        priority: 5,
        messageId: payload.mensagemId,
      })
      .build();

    await lastValueFrom(this.client.emit(this.filaStatus, record));
  }

  /** Exemplo: evento topic (fire-and-forget) */
  async emitUserCreated(payload: {
    userId: string;
    message: string;
    tenantId: string;
  }) {
    const record = new RmqRecordBuilder(payload)
      .setOptions({
        headers: { 'x-version': '1.0.0', 'x-tenant-id': payload.tenantId },
        priority: 8,
      })
      .build();

    await lastValueFrom(this.client.emit('notifications.user.created', record));
  }

  /** Exemplo: RPC (request/response) */
  async sendReplaceEmoji(message: string): Promise<string> {
    const record = new RmqRecordBuilder(message)
      .setOptions({
        headers: { 'x-version': '1.0.0' },
        priority: 5,
      })
      .build();

    return await lastValueFrom(
      this.client.send<string>(RABBITMQ_PATTERNS.NOTIFICATIONS_INSPECT, record),
    );
  }
}
