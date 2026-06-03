import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../mail/mail.module';
import { User } from '../entities/user.entity';
import { ServiceAuthGuard } from '@fems/shared';
import { UsersController } from './users.controller';
import { UsersInternalController } from './users-internal.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), MailModule],
  controllers: [UsersController, UsersInternalController],
  providers: [ServiceAuthGuard, UsersService],
  exports: [UsersService],
})
export class UsersModule {}
