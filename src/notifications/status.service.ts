import { Injectable } from '@nestjs/common';

@Injectable()
export class StatusService {
  private store = new Map<string, string>();

  setStatus(id: string, status: string) {
    this.store.set(id, status);
  }

  getStatus(id: string) {
    return this.store.get(id) || null;
  }
}
