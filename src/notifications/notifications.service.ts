import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async processarEntrada(data: {
    mensagemId: string;
    conteudoMensagem: string;
  }) {
    this.logger.log(
      `Iniciando processamento id=${data.mensagemId} conteudo="${data.conteudoMensagem}"`,
    );

    const delay = 1000 + Math.random() * 1000;
    await this.sleep(delay);

    this.logger.log(
      `Concluído processamento id=${data.mensagemId} (delay ~${Math.round(delay)}ms)`,
    );
  }
}
