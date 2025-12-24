import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminGuard } from '../auth/guards/admin.guard';
import { StudentService } from '../student/student.service';
import { LeaveRequestService } from '../leave-request/leave-request.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { ActionType } from '../audit-log/entities/audit-log.entity';
import { CreateStudentDto } from '../student/dto/create-student.dto';
import { UpdateStudentDto } from '../student/dto/update-student.dto';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly studentService: StudentService,
    private readonly leaveRequestService: LeaveRequestService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @UseGuards(AdminGuard)
  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '관리자 정보 조회', description: '현재 로그인한 관리자 정보를 조회합니다.' })
  async getMe(@Request() req) {
    const admin = await this.adminService.findById(req.user.id);
    return {
      id: admin.id,
      username: admin.username,
      name: admin.name,
    };
  }

  @UseGuards(AdminGuard)
  @Get('dashboard/status')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '대시보드 상태 조회', description: '현재 외박 현황을 조회합니다.' })
  async getDashboardStatus() {
    const status = await this.leaveRequestService.getCurrentStatus();
    return status;
  }

  @UseGuards(AdminGuard)
  @Get('dashboard/stats')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '대시보드 통계 조회', description: '대시보드용 종합 통계를 조회합니다.' })
  async getDashboardStats() {
    const studentCount = await this.studentService.getCount();
    const logStats = await this.auditLogService.getStats();
    const status = await this.leaveRequestService.getCurrentStatus();

    return {
      studentCount,
      ...status,
      logStats,
    };
  }

  @UseGuards(AdminGuard)
  @Get('students')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '학생 목록 조회', description: '검색/필터 조건으로 학생 목록을 조회합니다.' })
  async getStudents(
    @Query('search') search?: string,
    @Query('floor') floor?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.studentService.findAll({ search, floor, page, limit });
  }

  @UseGuards(AdminGuard)
  @Post('students')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '학생 추가', description: '새로운 학생을 수동으로 추가합니다.' })
  @ApiBody({ type: CreateStudentDto })
  async createStudent(@Body() dto: CreateStudentDto) {
    return this.studentService.create(dto);
  }

  @UseGuards(AdminGuard)
  @Get('students/:hakbun')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '학생 상세 조회', description: '학번으로 학생 상세 정보를 조회합니다.' })
  @ApiParam({ name: 'hakbun', description: '학번', example: '20231234' })
  async getStudent(@Param('hakbun') hakbun: string) {
    const student = await this.studentService.findOne(hakbun);
    const activeLeave = await this.leaveRequestService.getActiveLeave(hakbun);
    const { data: recentLeaves } = await this.leaveRequestService.findByHakbun(hakbun, {
      page: 1,
      limit: 5,
    });
    const { data: logs } = await this.auditLogService.findByHakbun(hakbun, {
      page: 1,
      limit: 10,
    });

    return {
      student,
      activeLeave,
      recentLeaves,
      logs,
    };
  }

  @UseGuards(AdminGuard)
  @Put('students/:hakbun')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '학생 정보 수정', description: '학생 정보를 수정합니다.' })
  @ApiParam({ name: 'hakbun', description: '학번', example: '20231234' })
  @ApiBody({ type: UpdateStudentDto })
  async updateStudent(
    @Param('hakbun') hakbun: string,
    @Body() dto: UpdateStudentDto,
  ) {
    return this.studentService.update(hakbun, dto);
  }

  @UseGuards(AdminGuard)
  @Delete('students/:hakbun')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '학생 삭제', description: '학생을 삭제합니다.' })
  @ApiParam({ name: 'hakbun', description: '학번', example: '20231234' })
  async deleteStudent(@Param('hakbun') hakbun: string) {
    await this.studentService.delete(hakbun);
    return { message: '학생이 삭제되었습니다.' };
  }

  @UseGuards(AdminGuard)
  @Get('leave-requests')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '외박 신청 목록 조회', description: '외박 신청 목록을 조회합니다.' })
  async getLeaveRequests(
    @Query('status') status?: 'active' | 'returned' | 'deleted' | 'all',
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.leaveRequestService.findAll({ status, search, page, limit });
  }

  @UseGuards(AdminGuard)
  @Get('leave-requests/:id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '외박 신청 상세 조회', description: '외박 신청 상세 정보를 조회합니다.' })
  async getLeaveRequest(@Param('id') id: number) {
    return this.leaveRequestService.findOne(id);
  }

  @UseGuards(AdminGuard)
  @Get('logs')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '감사 로그 조회', description: '감사 로그 목록을 조회합니다.' })
  async getLogs(
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
}
