import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { CustomerClient } from '../clients/customer.client';
import { MailModule } from '../mail/mail.module';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { UsersRegisterController } from './users-register.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { PasswordResetService } from './password-reset.service';

@Module({
  imports: [
    HttpModule,
    MailModule,
    UsersModule,
    AuditModule,
    TypeOrmModule.forFeature([RefreshToken, PasswordResetToken]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'dev-secret'),
        signOptions: {
          expiresIn: config.get('JWT_EXPIRES_IN', '15m') as `${number}m`,
        },
      }),
    }),
  ],
  controllers: [AuthController, UsersRegisterController],
  providers: [
    AuthService,
    PasswordResetService,
    JwtStrategy,
    CustomerClient,
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
