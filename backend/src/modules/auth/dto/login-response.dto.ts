import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class StudentResponseDto {
  @ApiProperty({ example: '20231234', description: '학번' })
  hakbun: string;

  @ApiProperty({ example: '홍길동', description: '이름' })
  name: string;

  @ApiProperty({ example: 4, description: '층수' })
  floor: number;

  @ApiProperty({ example: '401', description: '호실' })
  roomNo: string;

  @ApiProperty({ example: '010-1234-5678', description: '보호자 연락처' })
  guardianPhone: string;
}

class AdminResponseDto {
  @ApiProperty({ example: 1, description: '관리자 ID' })
  id: number;

  @ApiProperty({ example: 'admin', description: '관리자 아이디' })
  username: string;

  @ApiProperty({ example: '관리자', description: '관리자 이름' })
  name: string;
}

export class StudentLoginResponseDto {
  @ApiProperty({ 
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', 
    description: 'JWT 액세스 토큰' 
  })
  access_token: string;

  @ApiProperty({ type: StudentResponseDto })
  student: StudentResponseDto;
}

export class AdminLoginResponseDto {
  @ApiProperty({ 
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', 
    description: 'JWT 액세스 토큰' 
  })
  access_token: string;

  @ApiProperty({ type: AdminResponseDto })
  admin: AdminResponseDto;
}
