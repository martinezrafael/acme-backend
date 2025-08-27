import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: true })
export class NotificationsGateway {
  @WebSocketServer()
  server: Server;

  emitirStatusAtualizado(
    mensagemId: string,
    status: string,
    statusCode: number,
  ) {
    this.server.emit('statusAtualizado', { mensagemId, status, statusCode });
  }
}
