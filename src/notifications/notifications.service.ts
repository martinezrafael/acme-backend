// src/notifications/notifications.service.ts
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /** Simula 1–2s de processamento */
  async processarEntrada(data: {
    mensagemId: string;
    conteudoMensagem: string;
  }) {
    this.logger.log(
      `Iniciando processamento id=${data.mensagemId} conteudo="${data.conteudoMensagem}"`,
    );

    // atraso aleatório entre 1000 e 2000ms
    const delay = 1000 + Math.random() * 1000;
    await this.sleep(delay);

    this.logger.log(
      `Concluído processamento id=${data.mensagemId} (delay ~${Math.round(delay)}ms)`,
    );
  }
}
