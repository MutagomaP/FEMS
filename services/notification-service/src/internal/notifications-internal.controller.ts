import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ServiceAuthGuard } from '@fems/shared';
import { TriggerNotificationDto } from '../notifications/dto/trigger-notification.dto';
import { NotificationEngineService } from '../notifications/notification-engine.service';

@ApiTags('internal')
@Controller('internal/notifications')
@UseGuards(ServiceAuthGuard)
export class NotificationsInternalController {
  constructor(private readonly engine: NotificationEngineService) {}

  @Post('trigger')
  trigger(@Body() dto: TriggerNotificationDto) {
    return this.engine.createIdempotent(dto);
  }
}
