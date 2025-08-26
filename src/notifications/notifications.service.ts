import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  doWork(data: any) {
    this.logger.log(`Executando regra de negócio: ${JSON.stringify(data)}`);
  }
}
