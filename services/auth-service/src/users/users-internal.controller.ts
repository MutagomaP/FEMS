import { Controller, Get, NotFoundException, Param, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ServiceAuthGuard } from '@fems/shared';
import { UsersService } from './users.service';

@ApiTags('internal')
@Controller('internal/users')
@UseGuards(ServiceAuthGuard)
export class UsersInternalController {
  constructor(private readonly usersService: UsersService) {}

  @Get('admins')
  listAdmins() {
    return this.usersService.findAdmins();
  }

  @Get('customers')
  listCustomers() {
    return this.usersService.findCustomers();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.usersService.getProfile(id);
  }
}
