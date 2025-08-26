import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import {
  MicroserviceOptions,
  Transport,
  RmqStatus,
} from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const cfg = app.get(ConfigService);

  // 🔒 exija as envs e evite fallback
  const url = cfg.get<string>('RABBITMQ_URL');
  if (!url) throw new Error('RABBITMQ_URL não definida no .env');
  const queue = cfg.get<string>('RABBITMQ_QUEUE') ?? 'cats_queue';
  const prefetch = Number(cfg.get('RABBITMQ_PREFETCH') ?? 10);
  const maxPrio = Number(cfg.get('RABBITMQ_MAX_PRIORITY') ?? 10);
  const wild = String(cfg.get('RABBITMQ_WILDCARDS') ?? 'true') === 'true';

  // (opcional) log seguro para diagnosticar sem vazar senha
  try {
    const u = new URL(url);
    logger.log(
      `RMQ → host=${u.host} vhost=${u.pathname || '/'} TLS=${u.protocol === 'amqps:'}`,
    );
  } catch {
    logger.warn('RABBITMQ_URL inválida (não foi possível parsear URL)');
  }

  const server = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [url],
      queue,
      noAck: false,
      prefetchCount: prefetch,
      wildcards: wild,
      queueOptions: {
        durable: true,
        arguments: { 'x-max-priority': maxPrio },
      },
    },
  });

  server.status.subscribe((s: RmqStatus) =>
    logger.log(`RMQ Server status: ${s}`),
  );

  // 1) HTTP primeiro
  const port = Number(cfg.get('PORT') ?? 3000);
  await app.listen(port);
  logger.log(`HTTP on http://localhost:${port}`);

  // 2) Microservices depois
  await app.startAllMicroservices();
}
void bootstrap();
