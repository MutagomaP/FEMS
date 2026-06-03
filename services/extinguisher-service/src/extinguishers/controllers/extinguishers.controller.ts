import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  JwtAuthGuard,
  JwtPayload,
  Roles,
  RolesGuard,
  UserRole,
} from '@fems/shared';
import { CustomerClient } from '../../clients/service.clients';
import { AssignExtinguisherDto } from '../dtos/assign-extinguisher.dto';
import { CreateExtinguisherDto } from '../dtos/create-extinguisher.dto';
import { CreateStockExtinguisherDto } from '../dtos/create-stock-extinguisher.dto';
import {
  ListExtinguishersQueryDto,
  ListMineExtinguishersQueryDto,
} from '../dtos/list-extinguishers-query.dto';
import { UpdateExtinguisherDto } from '../dtos/update-extinguisher.dto';
import { ExtinguishersService } from '../services/extinguishers.service';

@ApiTags('extinguishers')
@Controller('extinguishers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT')
export class ExtinguishersController {
  constructor(
    private readonly extinguishersService: ExtinguishersService,
    private readonly customerClient: CustomerClient,
  ) {}

  @Get('mine')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'List owned extinguishers (customer)' })
  async findMine(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListMineExtinguishersQueryDto,
  ) {
    const customerId = await this.customerClient.resolveCustomerIdForUser(user);

    return this.extinguishersService.findMine(
      customerId,
      query.page ?? 1,
      query.limit ?? 10,
      {
        status: query.status,
        expiryFrom: query.expiryFrom,
        expiryTo: query.expiryTo,
        search: query.search,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      },
    );
  }

  @Post('stock')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Add extinguisher to warehouse stock (unassigned)' })
  createStock(
    @Body() dto: CreateStockExtinguisherDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.extinguishersService.createStock(dto, user);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Register a fire extinguisher assigned to a customer' })
  create(
    @Body() dto: CreateExtinguisherDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.extinguishersService.create(dto, user);
  }

  @Get('stock')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List extinguishers in stock (unassigned)' })
  findStock(@Query() query: ListExtinguishersQueryDto) {
    return this.extinguishersService.findStock(query.page ?? 1, query.limit ?? 100, {
      status: query.status,
      expiryFrom: query.expiryFrom,
      expiryTo: query.expiryTo,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.INSPECTOR)
  @ApiOperation({ summary: 'List extinguishers with filters (admin/inspector)' })
  findAll(@Query() query: ListExtinguishersQueryDto) {
    return this.extinguishersService.findAll(query.page ?? 1, query.limit ?? 10, {
      status: query.status,
      customerId: query.customerId,
      inStock: query.inStock,
      assignedOnly: query.assignedOnly,
      expiryFrom: query.expiryFrom,
      expiryTo: query.expiryTo,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  @Patch(':id/assign')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign in-stock extinguisher to a customer' })
  assign(
    @Param('id') id: string,
    @Body() dto: AssignExtinguisherDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.extinguishersService.assignToCustomer(id, dto, user);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER, UserRole.INSPECTOR)
  @ApiOperation({ summary: 'Get extinguisher by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const extinguisher = await this.extinguishersService.findById(id);
    if (user.role === UserRole.CUSTOMER) {
      const customer = await this.customerClient.findByEmail(user.email);
      if (!customer || !extinguisher.customerId || extinguisher.customerId !== customer.id) {
        throw new NotFoundException('Fire extinguisher not found');
      }
    }
    return extinguisher;
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update extinguisher (admin, PATCH)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateExtinguisherDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.extinguishersService.update(id, dto, user);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update extinguisher (admin, PUT checklist alias)' })
  updatePut(
    @Param('id') id: string,
    @Body() dto: UpdateExtinguisherDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.extinguishersService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete extinguisher (admin)' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.extinguishersService.remove(id, user);
  }
}
