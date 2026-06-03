import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, Roles, RolesGuard, UserRole } from '@fems/shared';
import { ComplianceService } from './compliance.service';
import {
  CreateComplianceCaseDto,
  UpdateComplianceCaseDto,
} from './dto/compliance-case.dto';
import { ListComplianceCasesQueryDto } from './dto/list-compliance-cases-query.dto';

@ApiTags('compliance')
@Controller('compliance/cases')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth('JWT')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get()
  findAll(@Query() query: ListComplianceCasesQueryDto) {
    return this.complianceService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.complianceService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateComplianceCaseDto) {
    return this.complianceService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateComplianceCaseDto,
  ) {
    return this.complianceService.update(id, dto);
  }

  @Post(':id/close')
  close(@Param('id', ParseUUIDPipe) id: string, @Body('notes') notes?: string) {
    return this.complianceService.close(id, notes);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.complianceService.remove(id);
  }
}
