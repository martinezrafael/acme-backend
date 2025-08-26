import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsProducer } from './notifications.producer';
import { RabbitmqClientModule } from '../messaging/rabbitmq-client.module';
import { NotificationsHttpController } from './notifications.http.controller';
import { StatusService } from './status.service';

@Module({
  imports: [RabbitmqClientModule],
  controllers: [NotificationsController, NotificationsHttpController],
  providers: [NotificationsService, NotificationsProducer, StatusService],
  exports: [NotificationsProducer],
})
export class NotificationsModule {}
