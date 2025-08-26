import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [ApiController],
})
export class ApiModule {}
