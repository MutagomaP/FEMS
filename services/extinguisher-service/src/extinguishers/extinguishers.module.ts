import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerClient, NotificationClient } from '../clients/service.clients';
import { ExtinguisherAuditService } from '../audit/extinguisher-audit.service';
import { ExtinguishersController } from './controllers/extinguishers.controller';
import { ExtinguishersInternalController } from './controllers/extinguishers-internal.controller';
import { ExtinguisherAuditLog } from '../entities/extinguisher-audit-log.entity';
import { FireExtinguisher } from './entities/fire-extinguisher.entity';
import { ExtinguishersRepository } from './repositories/extinguishers.repository';
import { ExtinguisherCronService } from './services/extinguisher-cron.service';
import { ExtinguisherNotificationService } from './services/extinguisher-notification.service';
import { ExtinguishersService } from './services/extinguishers.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([FireExtinguisher, ExtinguisherAuditLog]),
    HttpModule,
  ],
  controllers: [ExtinguishersController, ExtinguishersInternalController],
  providers: [
    ExtinguishersService,
    ExtinguisherCronService,
    ExtinguisherNotificationService,
    ExtinguishersRepository,
    ExtinguisherAuditService,
    CustomerClient,
    NotificationClient,
  ],
  exports: [ExtinguishersService],
})
export class ExtinguishersModule {}
