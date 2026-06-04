import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthClient } from '../clients/auth.client';
import { CustomersController } from './controllers/customers.controller';
import { CustomersInternalController } from './controllers/customers-internal.controller';
import { Customer } from './entities/customer.entity';
import { CustomersRepository } from './repositories/customers.repository';
import { CustomersService } from './services/customers.service';

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([Customer])],
  controllers: [CustomersController, CustomersInternalController],
  providers: [CustomersService, CustomersRepository, AuthClient],
  exports: [CustomersService],
})
export class CustomersModule {}
