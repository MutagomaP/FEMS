import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationChannel } from '../../enums/notification-channel.enum';
import { NotificationType } from '../../enums/notification-type.enum';

export class TriggerNotificationDto {
  @ApiProperty()
  @IsUUID()
  customerId: string;

  @ApiProperty()
  @IsUUID()
  extinguisherId: string;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiPropertyOptional({ enum: NotificationChannel, default: NotificationChannel.EMAIL })
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  recipientEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recipientPhone?: string;

  @ApiPropertyOptional({ description: 'Fire extinguisher serial number (for email body)' })
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @ApiPropertyOptional({ description: 'ISO expiry date (for email body)' })
  @IsOptional()
  @IsString()
  expiryDate?: string;

  @ApiPropertyOptional({ description: 'Days until expiry (for email body)' })
  @IsOptional()
  @IsInt()
  daysUntilExpiry?: number;

  @ApiPropertyOptional({ description: 'Extinguisher status label (for email body)' })
  @IsOptional()
  @IsString()
  extinguisherStatus?: string;

  @ApiPropertyOptional({
    description:
      'When true, always creates a new notification (e.g. per admin/inspector recipient)',
  })
  @IsOptional()
  skipIdempotency?: boolean;
}
