import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CustomerClient } from './customer.client';

@Module({
  imports: [HttpModule],
  providers: [CustomerClient],
  exports: [CustomerClient],
})
export class ClientsModule {}
