# Guia de Execução e Testes – acme-backend

## 1. Pré-requisitos

- Node.js >= 20
- npm (ou pnpm/yarn, mas aqui usamos npm porque há `package-lock.json`)
- Instância RabbitMQ acessível via **AMQPS** (ex.: CloudAMQP)

## 2. Instalação

```bash
npm ci
```

## 3. Configuração

Crie um arquivo `.env` na raiz (ou adapte o existente) com:

```ini
RABBITMQ_URL=amqps://<user>:<pass>@<host>/<vhost>
RABBITMQ_QUEUE=fila.notificacao.entrada.rafael
RABBITMQ_STATUS_QUEUE=fila.notificacao.status.rafael
RABBITMQ_PREFETCH=10
RABBITMQ_MAX_PRIORITY=10
RABBITMQ_WILDCARDS=true
PORT=3000
```

> ⚠️ Sempre use **AMQPS (TLS)** em provedores externos.

## 4. Rodar em desenvolvimento

```bash
npm run start:dev
# HTTP → http://localhost:3000
```

O microserviço RMQ também conecta automaticamente e começa a consumir filas.

## 5. Testes rápidos com `curl`

**Enfileirar mensagem**

```bash
curl -X POST http://localhost:3000/api/notificar \
  -H 'Content-Type: application/json' \
  -d '{ "mensagemId": "<uuid>", "conteudoMensagem": "Olá!" }'
```

**Consultar status**

```bash
curl http://localhost:3000/api/status/<uuid>
```

**Emitir evento de domínio**

```bash
curl -X POST http://localhost:3000/notifications/test-emit \
  -H 'Content-Type: application/json' \
  -d '{ "userId": "u-123", "tenantId": "tenant-demo", "message": "Hello!" }'
```

## 6. Testes automatizados

- **Unitários**:

```bash
npm test
```

- **Cobertura**:

```bash
npm run test:cov
```

- **E2E**:

```bash
npm run test:e2e
```

## 7. Lint & Format

```bash
npm run lint
npm run format
```

## 8. Build & Produção

```bash
npm run build
npm run start:prod
```

## 9. Troubleshooting

- **Conexão RMQ**: verifique logs no boot (`RMQ → host=... TLS=...`).
- **URL inválida**: o boot avisa se não conseguir parsear `RABBITMQ_URL`.
- **Sem status**: `GET /api/status/:id` retorna `PENDENTE` (202) se ainda não processou.
- **CloudAMQP**: confirme que vhost, usuário e filas existem.
- **Sem TLS (amqp\://)**: o código alerta com `console.warn`.

## 10. Scripts npm disponíveis

| Script       | Descrição                                 |
| ------------ | ----------------------------------------- |
| `start`      | Inicia app (modo padrão)                  |
| `start:dev`  | Inicia em modo desenvolvimento (watch)    |
| `start:prod` | Inicia buildado em produção               |
| `build`      | Compila TypeScript para `dist/`           |
| `test`       | Executa testes unitários                  |
| `test:cov`   | Executa testes com relatório de cobertura |
| `test:e2e`   | Executa testes end-to-end                 |
| `lint`       | Executa ESLint com autofix                |
| `format`     | Formata código com Prettier               |
