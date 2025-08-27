import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { ApiStatusController } from './api.status.controller';

@Module({
  imports: [NotificationsModule],
  controllers: [ApiController, ApiStatusController],
})
export class ApiModule {}
