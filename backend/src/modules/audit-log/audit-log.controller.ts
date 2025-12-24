import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AuditLogService } from './audit-log.service';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ActionType } from './entities/audit-log.entity';

@ApiTags('audit-log')
@Controller('audit-log')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @UseGuards(AdminGuard)
  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '감사 로그 목록 조회', description: '필터 조건에 따른 감사 로그 목록을 조회합니다.' })
  async findAll(
    @Query('actionType') actionType?: ActionType,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.auditLogService.findAll({
      actionType,
      search,
      startDate,
      endDate,
      page,
      limit,
    });
  }

  @UseGuards(AdminGuard)
  @Get('stats')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '감사 로그 통계', description: '감사 로그 통계를 조회합니다.' })
  async getStats() {
    return this.auditLogService.getStats();
  }

  @UseGuards(AdminGuard)
  @Get(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '로그 상세 조회', description: '특정 로그와 관련된 모든 활동 내역을 조회합니다.' })
  @ApiParam({ name: 'id', description: '로그 ID', example: 1 })
  async findOne(@Param('id') id: number) {
    const log = await this.auditLogService.findOne(id);
    
    // 해당 외박신청에 대한 모든 로그 조회
    let relatedLogs: any[] = [];
    if (log.leaveRequestId) {
      relatedLogs = await this.auditLogService.findByLeaveRequestId(log.leaveRequestId);
    }
    
    return {
      log,
      relatedLogs,
    };
  }
}
