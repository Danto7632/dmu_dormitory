import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StudentService } from './student.service';
import { StudentGuard } from '../auth/guards/student.guard';
import { LeaveRequestService } from '../leave-request/leave-request.service';
import { AuditLogService } from '../audit-log/audit-log.service';

@ApiTags('student')
@Controller('student')
export class StudentController {
  constructor(
    private readonly studentService: StudentService,
    private readonly leaveRequestService: LeaveRequestService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @UseGuards(StudentGuard)
  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '내 정보 조회', description: '현재 로그인한 학생의 정보와 활성 외박을 조회합니다.' })
  async getMe(@Request() req) {
    const student = await this.studentService.findByHakbun(req.user.sub);
    const activeLeave = await this.leaveRequestService.getActiveLeave(req.user.sub);
    
    return {
      student,
      activeLeave,
      hasActiveLeave: !!activeLeave,
    };
  }

  @UseGuards(StudentGuard)
  @Get('my-leaves')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '내 외박 내역 조회' })
  async getMyLeaves(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.leaveRequestService.findByHakbun(req.user.sub, { page, limit });
  }

  @UseGuards(StudentGuard)
  @Get('my-logs')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '내 활동 로그 조회' })
  async getMyLogs(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.auditLogService.findByHakbun(req.user.sub, { page, limit });
  }
}
