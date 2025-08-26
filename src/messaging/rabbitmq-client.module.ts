import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RABBITMQ_CLIENTS } from './rabbitmq.constants';

@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: RABBITMQ_CLIENTS.NOTIFICATIONS,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (cfg: ConfigService) => {
          // Pegue e valide as variáveis
          const url = cfg.get<string>('RABBITMQ_URL');
          if (!url) {
            throw new Error('RABBITMQ_URL não definida no .env');
          }
          const queue = cfg.get<string>('RABBITMQ_QUEUE');
          if (!queue) {
            throw new Error('RABBITMQ_QUEUE não definida no .env');
          }

          const maxPriority = Number(cfg.get('RABBITMQ_MAX_PRIORITY') ?? 10);

          if (!url.startsWith('amqps://')) {
            console.warn('[RabbitMQ] Atenção: use amqps:// na CloudAMQP');
          }

          return {
            transport: Transport.RMQ,
            options: {
              urls: [url],
              queue,
              queueOptions: {
                durable: true,
                arguments: { 'x-max-priority': maxPriority },
              },
            },
          };
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class RabbitmqClientModule {}
