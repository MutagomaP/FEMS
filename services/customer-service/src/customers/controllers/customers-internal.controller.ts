import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ServiceAuthGuard } from '@fems/shared';
import { EnsureCustomerDto } from '../dtos/ensure-customer.dto';
import { CustomersService } from '../services/customers.service';

@ApiTags('internal')
@Controller('internal/customers')
@UseGuards(ServiceAuthGuard)
export class CustomersInternalController {
  constructor(private readonly customersService: CustomersService) {}

  @Get('by-id/:id')
  findById(@Param('id') id: string) {
    return this.customersService.findById(id);
  }

  @Get('by-email/:email')
  findByEmail(@Param('email') email: string) {
    return this.customersService.findByEmail(email);
  }

  @Post('ensure')
  ensure(@Body() dto: EnsureCustomerDto) {
    return this.customersService.ensureByEmail(dto.email, dto.fullName);
  }
}
