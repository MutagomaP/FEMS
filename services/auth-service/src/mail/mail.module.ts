import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NotificationMailClient } from '../clients/notification-mail.client';
import { WelcomeEmailService } from './welcome-email.service';

@Module({
  imports: [HttpModule],
  providers: [NotificationMailClient, WelcomeEmailService],
  exports: [NotificationMailClient, WelcomeEmailService],
})
export class MailModule {}
