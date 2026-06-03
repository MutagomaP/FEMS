import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createTypeOrmConfig } from '@fems/shared';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { AuditLog } from './entities/audit-log.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { User } from './entities/user.entity';
import { UsersModule } from './users/users.module';
import { runAuthSchemaFix } from './database/auth-schema.fix';
import { SeedService } from './seed/seed.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        await runAuthSchemaFix(config);
        return createTypeOrmConfig(config, [
          User,
          RefreshToken,
          AuditLog,
          PasswordResetToken,
        ]);
      },
    }),
    TypeOrmModule.forFeature([User]),
    AuthModule,
    UsersModule,
    AuditModule,
  ],
  providers: [
    SeedService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
