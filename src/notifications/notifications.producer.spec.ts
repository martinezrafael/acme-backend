import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsProducer } from './notifications.producer';
import { ClientProxy } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import {
  RABBITMQ_CLIENTS,
  RABBITMQ_PATTERNS,
} from '../messaging/rabbitmq.constants';

describe('NotificationsProducer', () => {
  let producer: NotificationsProducer;
  let client: ClientProxy;
  let configService: ConfigService;

  beforeEach(async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    client = {
      send: jest.fn(),
      emit: jest.fn(),
      status: { subscribe: jest.fn() },
    } as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'RABBITMQ_QUEUE') return 'test-queue';
        if (key === 'RABBITMQ_STATUS_QUEUE') return 'test-status-queue';
        return undefined;
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsProducer,
        { provide: RABBITMQ_CLIENTS.NOTIFICATIONS, useValue: client },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    producer = module.get<NotificationsProducer>(NotificationsProducer);
  });

  it('deve publicar mensagem na fila corretamente', async () => {
    // Corrige o mock para retornar um Observable
    (client.send as jest.Mock).mockReturnValue(of('ok'));
    const message = 'teste';
    await producer.sendReplaceEmoji(message);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(client.send).toHaveBeenCalledWith(
      RABBITMQ_PATTERNS.NOTIFICATIONS_INSPECT,
      expect.objectContaining({
        data: message,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        options: expect.objectContaining({ priority: 5 }),
      }),
    );
  });
});
