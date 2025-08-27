# Documento de Visão – acme-backend

## Propósito

O **acme-backend** é um serviço backend em **NestJS** que demonstra um fluxo de **notificações assíncronas** usando **RabbitMQ** (CloudAMQP). Ele oferece:

- **API HTTP** para enfileirar uma mensagem ("entrada") e consultar seu **status**.
- **Consumidores RMQ** para processar mensagens e publicar **eventos de status**.
- **Produtor RMQ** para emitir eventos de domínio (ex.: `notifications.user.created`) e publicar em filas de **entrada** e **status**.

## Problema que resolve

Desacopla a recepção HTTP do **processamento assíncrono** potencialmente custoso/variável, respondendo rapidamente ao cliente (202 Accepted) e permitindo acompanhar o **andamento** via endpoint de status.

## Público-alvo

Times que procuram um **boilerplate** de mensageria com NestJS + RabbitMQ: squads de plataforma, integrações, ou serviços que precisam de **fila**, **priorização**, **headers** (correlação/tenant/versionamento) e **observabilidade básica** via logs.

## Visão de alto nível (fluxo)

1. **Cliente** chama `POST /api/notificar` com `mensagemId` (UUID) e `conteudoMensagem`.
2. Serviço publica na **fila de entrada** (RMQ). Resposta: 202 Accepted.
3. **Consumidor** lê da fila, simula processamento (delay aleatório), marca `PROCESSADO_SUCESSO` ou `FALHA_PROCESSAMENTO` e **publica status** em outra fila.
4. **StatusService** mantém status **em memória** por `mensagemId`.
5. Cliente consulta `GET /api/status/:mensagemId`.

> Em produção, substituir armazenamento em memória por **Redis/DB** com **TTL**.
