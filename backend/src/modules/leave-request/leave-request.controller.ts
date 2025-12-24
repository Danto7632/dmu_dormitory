import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { LeaveRequestService } from './leave-request.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { LeaveRequestResponseDto } from './dto/leave-request-response.dto';
import { StudentGuard } from '../auth/guards/student.guard';

@ApiTags('leave-request')
@ApiBearerAuth('access-token')
@Controller('leave-request')
export class LeaveRequestController {
  constructor(private readonly leaveRequestService: LeaveRequestService) {}

  @UseGuards(StudentGuard)
  @Post()
  @ApiOperation({ summary: '외박 신청', description: '새로운 외박을 신청합니다. 이미 활성화된 외박이 있으면 신청할 수 없습니다.' })
  @ApiBody({ type: CreateLeaveRequestDto })
  @ApiResponse({ status: 201, description: '외박 신청 성공', type: LeaveRequestResponseDto })
  @ApiResponse({ status: 400, description: '이미 외박 중입니다.' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  async create(@Request() req, @Body() dto: CreateLeaveRequestDto) {
    return this.leaveRequestService.create(req.user.sub, dto);
  }

  @UseGuards(StudentGuard)
  @Put(':id')
  @ApiOperation({ summary: '외박 수정', description: '기존 외박 신청을 수정합니다. 본인의 외박만 수정 가능합니다.' })
  @ApiParam({ name: 'id', description: '외박 신청 ID', example: 1 })
  @ApiBody({ type: UpdateLeaveRequestDto })
  @ApiResponse({ status: 200, description: '외박 수정 성공', type: LeaveRequestResponseDto })
  @ApiResponse({ status: 404, description: '외박 신청을 찾을 수 없습니다.' })
  async update(
    @Request() req,
    @Param('id') id: number,
    @Body() dto: UpdateLeaveRequestDto,
  ) {
    return this.leaveRequestService.update(req.user.sub, id, dto);
  }

  @UseGuards(StudentGuard)
  @Delete(':id')
  @ApiOperation({ summary: '외박 삭제', description: '외박 신청을 삭제합니다. 본인의 외박만 삭제 가능합니다.' })
  @ApiParam({ name: 'id', description: '외박 신청 ID', example: 1 })
  @ApiResponse({ status: 200, description: '외박 삭제 성공' })
  @ApiResponse({ status: 404, description: '외박 신청을 찾을 수 없습니다.' })
  async delete(@Request() req, @Param('id') id: number) {
    return this.leaveRequestService.delete(req.user.sub, id);
  }

  @UseGuards(StudentGuard)
  @Post(':id/return')
  @ApiOperation({ summary: '귀사 완료', description: '외박에서 귀사 처리를 완료합니다.' })
  @ApiParam({ name: 'id', description: '외박 신청 ID', example: 1 })
  @ApiResponse({ status: 200, description: '귀사 완료', type: LeaveRequestResponseDto })
  @ApiResponse({ status: 404, description: '외박 신청을 찾을 수 없습니다.' })
  async returnHome(@Request() req, @Param('id') id: number) {
    return this.leaveRequestService.returnHome(req.user.sub, id);
  }

  @UseGuards(StudentGuard)
  @Get('active')
  @ApiOperation({ summary: '활성 외박 조회', description: '현재 활성화된(삭제되지 않고 귀사하지 않은) 외박을 조회합니다.' })
  @ApiResponse({ status: 200, description: '활성 외박 조회 성공', type: LeaveRequestResponseDto })
  @ApiResponse({ status: 404, description: '활성 외박이 없습니다.' })
  async getActiveLeave(@Request() req) {
    return this.leaveRequestService.getActiveLeave(req.user.sub);
  }
}
