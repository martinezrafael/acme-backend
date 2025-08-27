# Documentação Técnica – acme-backend

## Arquitetura & Módulos

- **AppModule** (`src/app.module.ts`) – Carrega `ConfigModule`, `NotificationsModule`, `ApiModule`.
- **ApiModule** (`src/api`) – Controladores HTTP:
- `POST /api/notificar` → usa `NotificationsProducer.publicarEntrada`.
- `GET /api/status/:mensagemId` → consulta `StatusService`.
- **NotificationsModule** (`src/notifications`) – Mensageria/Processamento:
- **Controllers RMQ**: consumo de entrada, inspeção (`notifications.inspect`) e wildcard (`notifications.#`).
- **Producer**: publica em **entrada** e **status**; emite `notifications.user.created`.
- **Service**: simula processamento com delay.
- **StatusService**: armazena status (em memória) por `mensagemId`.
- **Messaging** (`src/messaging`) – `RabbitmqClientModule` registra `ClientProxy` RMQ com TLS, fila e prioridade.

## Endpoints HTTP

- `GET /` → "Hello World!" (saúde básica)
- `POST /api/notificar` (202)
- **Body**: `{ mensagemId: string (UUID), conteudoMensagem: string }`
- **Resposta**: `{ status: 'accepted', mensagemId }` ou `{ status: 'failed_to_enqueue', statusCode: 500 }`
- `GET /api/status/:mensagemId`
- Pendente → `{ statusCode: 202, status: 'PENDENTE', mensagemId }`
- Encontrado → `{ statusCode: 200, status, mensagemId }`
- `POST /notifications/test-emit`
- **Body**: `{ userId: string, tenantId?: string, message?: string }`
- Efeito: emite `notifications.user.created` (headers `x-tenant-id`, `x-version`, prioridade 8).

## Filas, Patterns e Headers

- **Filas (.env)**
- `RABBITMQ_QUEUE` → fila de **entrada** (ex.: `fila.notificacao.entrada.rafael`).
- `RABBITMQ_STATUS_QUEUE` → fila de **status** (ex.: `fila.notificacao.status.rafael`).
- **Patterns** (`src/messaging/rabbitmq.constants.ts`)
- `notifications`, `notifications.inspect`, `notifications.#`.
- **Headers** (Producer via `RmqRecordBuilder`)
- `x-version`, `x-correlation-id`, `x-tenant-id` (quando aplicável), `priority`, `messageId`.

## Boot & Configuração (src/main.ts)

- `ValidationPipe` global (whitelist/forbidNonWhitelisted/transform).
- Microservice RMQ (`Transport.RMQ`) com `prefetchCount`, `wildcards`, `x-max-priority`, `noAck=false`.
- Logs: status de servidor/cliente RMQ e parse da `RABBITMQ_URL`.

## Variáveis de Ambiente (.env)

```ini
RABBITMQ_URL=amqps://<user>:<pass>@<host>/<vhost>
RABBITMQ_QUEUE=fila.notificacao.entrada.rafael
RABBITMQ_STATUS_QUEUE=fila.notificacao.status.rafael
RABBITMQ_PREFETCH=10
RABBITMQ_MAX_PRIORITY=10
RABBITMQ_WILDCARDS=true
PORT=3000
```
