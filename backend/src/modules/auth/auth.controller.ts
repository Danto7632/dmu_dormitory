import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { StudentLoginDto } from './dto/student-login.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { StudentLoginResponseDto, AdminLoginResponseDto } from './dto/login-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('student/login')
  @ApiOperation({ summary: '학생 로그인', description: '학번으로 로그인합니다. 비밀번호 없이 학번만으로 인증됩니다.' })
  @ApiBody({ type: StudentLoginDto })
  @ApiResponse({ 
    status: 200, 
    description: '로그인 성공',
    type: StudentLoginResponseDto,
  })
  @ApiResponse({ status: 401, description: '등록되지 않은 학번입니다.' })
  async studentLogin(@Body() dto: StudentLoginDto) {
    return this.authService.studentLogin(dto);
  }

  @Post('admin/login')
  @ApiOperation({ summary: '관리자 로그인', description: '아이디와 비밀번호로 로그인합니다.' })
  @ApiBody({ type: AdminLoginDto })
  @ApiResponse({ 
    status: 200, 
    description: '로그인 성공',
    type: AdminLoginResponseDto,
  })
  @ApiResponse({ status: 401, description: '아이디 또는 비밀번호가 일치하지 않습니다.' })
  async adminLogin(@Body() dto: AdminLoginDto) {
    return this.authService.adminLogin(dto);
  }
}
