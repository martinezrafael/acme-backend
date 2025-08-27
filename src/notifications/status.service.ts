import { Injectable } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class StatusService {
  private store = new Map<string, { status: string; statusCode: number }>();

  constructor(private notificationsGateway: NotificationsGateway) {}

  setStatus(id: string, status: string, statusCode: number) {
    this.store.set(id, { status, statusCode });
    this.notificationsGateway.emitirStatusAtualizado(id, status, statusCode);
  }

  getStatus(id: string) {
    return this.store.get(id) || null;
  }
}
