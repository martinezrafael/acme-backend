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
import { lastValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { Subscription } from 'rxjs';
import {
  RABBITMQ_CLIENTS,
  RABBITMQ_PATTERNS,
} from '../messaging/rabbitmq.constants';

@Injectable()
export class NotificationsProducer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsProducer.name);
  private statusSub?: Subscription;
  private filaEntrada: string;
  private onError = (err: unknown) => {
    this.logger.error('RMQ Client error', err as any);
  };

  constructor(
    @Inject(RABBITMQ_CLIENTS.NOTIFICATIONS)
    private readonly client: ClientProxy,
    private readonly cfg: ConfigService,
  ) {
    const q = this.cfg.get<string>('RABBITMQ_QUEUE');
    if (!q) throw new Error('RABBITMQ_QUEUE não definida no .env');
    this.filaEntrada = q;
  }

  onModuleInit() {
    // status (connected/disconnected)
    this.statusSub = this.client.status.subscribe((s: RmqStatus) => {
      this.logger.log(`RMQ Client status: ${s}`);
    });
  }

  onModuleDestroy() {
    this.statusSub?.unsubscribe();
    // remove o listener se suportado
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    (this.client as any).off?.('error', this.onError);
  }

  async publicarEntrada(payload: {
    mensagemId: string;
    conteudoMensagem: string;
  }) {
    const record = new RmqRecordBuilder(payload)
      .setOptions({
        headers: { 'x-version': '1.0.0' },
        priority: 5,
      })
      .build();

    // Importante: usar a routingKey com o NOME DA FILA
    await lastValueFrom(this.client.emit(this.filaEntrada, record));
  }

  /** Exemplo: envia evento usando curingas de routing key (topic) */
  async emitUserCreated(payload: {
    userId: string;
    message: string;
    tenantId: string;
  }) {
    const record = new RmqRecordBuilder(payload)
      .setOptions({
        headers: {
          'x-version': '1.0.0',
          'x-tenant-id': payload.tenantId,
        },
        priority: 8,
      })
      .build();

    // Evento (fire-and-forget). Routing key: notifications.user.created
    await lastValueFrom(this.client.emit('notifications.user.created', record));
  }

  /** Exemplo: RPC (espera resposta) */
  async sendReplaceEmoji(message: string): Promise<string> {
    const record = new RmqRecordBuilder(message)
      .setOptions({
        headers: { 'x-version': '1.0.0' },
        priority: 3,
      })
      .build();

    const result: string = await lastValueFrom(
      this.client.send(RABBITMQ_PATTERNS.NOTIFICATIONS_INSPECT, record),
    );
    return result;
  }
}
