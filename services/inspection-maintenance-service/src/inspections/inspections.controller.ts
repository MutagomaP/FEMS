import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  JwtAuthGuard,
  JwtPayload,
  Roles,
  RolesGuard,
  UserRole,
} from '@fems/shared';
import {
  AuthClient,
  CustomerClient,
  ExtinguisherClient,
} from '../clients/service.clients';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { ListInspectionsQueryDto } from './dto/list-inspections-query.dto';
import { InspectionStatus } from '../enums/inspection-status.enum';
import { InspectionsService } from './inspections.service';

@ApiTags('inspections')
@Controller('inspections')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT')
export class InspectionsController {
  constructor(
    private readonly inspectionsService: InspectionsService,
    private readonly customerClient: CustomerClient,
    private readonly extinguisherClient: ExtinguisherClient,
    private readonly authClient: AuthClient,
  ) {}

  @Post()
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN, UserRole.INSPECTOR)
  @ApiOperation({ summary: 'Schedule an inspection' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateInspectionDto,
  ) {
    let customerId = dto.customerId;
    if (user.role === UserRole.CUSTOMER) {
      customerId = await this.customerClient.resolveCustomerIdForUser(user);
      const ownerId = await this.extinguisherClient.getCustomerIdForExtinguisher(
        dto.extinguisherId,
      );
      if (ownerId !== customerId) {
        throw new BadRequestException(
          'You can only schedule inspections for your own fire extinguishers',
        );
      }
    } else if (!customerId) {
      customerId = await this.extinguisherClient.getCustomerIdForExtinguisher(
        dto.extinguisherId,
      );
    }
    if (!customerId) {
      throw new BadRequestException(
        'Could not determine customer for the selected extinguisher. Choose a valid extinguisher.',
      );
    }
    if (dto.inspectorUserId) {
      await this.authClient.assertInspector(dto.inspectorUserId);
    }
    return this.inspectionsService.create(dto, user, customerId);
  }

  @Get('mine')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'List own scheduled inspections' })
  async findMine(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListInspectionsQueryDto,
  ) {
    const customerId = await this.customerClient.resolveCustomerIdForUser(user);
    return this.inspectionsService.findAll({ ...query, customerId });
  }

  @Get('history')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Inspection history for current customer' })
  async history(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListInspectionsQueryDto,
  ) {
    const customerId = await this.customerClient.resolveCustomerIdForUser(user);
    return this.inspectionsService.findAll({ ...query, customerId });
  }

  @Get('assigned')
  @Roles(UserRole.INSPECTOR)
  @ApiOperation({ summary: 'List inspections assigned to the current inspector' })
  findAssigned(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListInspectionsQueryDto,
  ) {
    return this.inspectionsService.findAll({
      ...query,
      inspectorUserId: user.sub,
    });
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.INSPECTOR)
  @ApiOperation({ summary: 'List inspections (admin: all; inspector: assigned only)' })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListInspectionsQueryDto,
  ) {
    if (user.role === UserRole.INSPECTOR) {
      return this.inspectionsService.findAll({
        ...query,
        inspectorUserId: user.sub,
      });
    }
    return this.inspectionsService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.INSPECTOR, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get inspection by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const row = await this.inspectionsService.findById(id);
    if (user.role === UserRole.CUSTOMER) {
      const customerId = await this.customerClient.resolveCustomerIdForUser(user);
      if (row.customerId !== customerId) {
        throw new NotFoundException('Inspection schedule not found');
      }
    }
    return row;
  }

  @Patch(':id/complete')
  @Roles(UserRole.INSPECTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Mark inspection completed' })
  async complete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const row = await this.inspectionsService.findById(id);
    if (
      user.role === UserRole.INSPECTOR &&
      row.inspectorUserId &&
      row.inspectorUserId !== user.sub
    ) {
      throw new ForbiddenException(
        'This inspection is assigned to another inspector',
      );
    }
    return this.inspectionsService.complete(id, user.sub);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER, UserRole.INSPECTOR)
  @ApiOperation({ summary: 'Cancel scheduled inspection' })
  async cancel(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const row = await this.inspectionsService.findById(id);
    if (user.role === UserRole.CUSTOMER) {
      const customerId = await this.customerClient.resolveCustomerIdForUser(user);
      if (row.customerId !== customerId) {
        throw new NotFoundException('Inspection schedule not found');
      }
    }
    return this.inspectionsService.cancel(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER, UserRole.INSPECTOR)
  @ApiOperation({ summary: 'Delete an inspection schedule' })
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const row = await this.inspectionsService.findById(id);

    if (user.role === UserRole.CUSTOMER) {
      const customerId = await this.customerClient.resolveCustomerIdForUser(user);
      if (row.customerId !== customerId) {
        throw new NotFoundException('Inspection schedule not found');
      }
    }

    if (user.role === UserRole.INSPECTOR) {
      if (row.inspectorUserId && row.inspectorUserId !== user.sub) {
        throw new ForbiddenException(
          'This inspection is assigned to another inspector',
        );
      }
    }

    if (
      user.role !== UserRole.ADMIN &&
      row.status === InspectionStatus.COMPLETED
    ) {
      throw new BadRequestException('Completed inspections cannot be deleted');
    }

    await this.inspectionsService.remove(id);
    return { deleted: true };
  }
}
