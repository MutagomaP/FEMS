import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { PassportModule } from '@nestjs/passport';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  createTypeOrmConfig,
  JwtPayloadStrategy,
  ServiceAuthGuard,
} from '@fems/shared';
import {
  AuthClient,
  CustomerClient,
  ExtinguisherClient,
  NotificationClient,
} from './clients/service.clients';
import { InspectionOverdueCron } from './cron/inspection-overdue.cron';
import { runInspectionSchemaFix } from './database/inspection-schema.fix';
import { InspectionSchedule } from './entities/inspection-schedule.entity';
import { MaintenanceLog } from './entities/maintenance-log.entity';
import { InspectionReportController } from './internal/inspection-report.controller';
import { InspectionsController } from './inspections/inspections.controller';
import { InspectionsService } from './inspections/inspections.service';
import { MaintenanceController } from './maintenance/maintenance.controller';
import { MaintenanceService } from './maintenance/maintenance.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule,
    ScheduleModule.forRoot(),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        await runInspectionSchemaFix(config);
        return createTypeOrmConfig(config, [InspectionSchedule, MaintenanceLog]);
      },
    }),
    TypeOrmModule.forFeature([InspectionSchedule, MaintenanceLog]),
  ],
  controllers: [
    InspectionsController,
    MaintenanceController,
    InspectionReportController,
  ],
  providers: [
    InspectionsService,
    MaintenanceService,
    CustomerClient,
    ExtinguisherClient,
    AuthClient,
    NotificationClient,
    InspectionOverdueCron,
    JwtPayloadStrategy,
    ServiceAuthGuard,
  ],
})
export class AppModule {}
