import { IsNotEmpty, IsString, IsNumber, IsOptional, Min, Max, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStudentDto {
  @ApiProperty({ description: '학번', example: '20231234' })
  @IsNotEmpty({ message: '학번을 입력해주세요.' })
  @IsString()
  hakbun: string;

  @ApiProperty({ description: '이름', example: '홍길동' })
  @IsNotEmpty({ message: '이름을 입력해주세요.' })
  @IsString()
  name: string;

  @ApiProperty({ description: '층수 (2-9)', example: 4 })
  @IsNotEmpty({ message: '층수를 입력해주세요.' })
  @IsNumber()
  @Min(2, { message: '층수는 2층 이상이어야 합니다.' })
  @Max(9, { message: '층수는 9층 이하여야 합니다.' })
  floor: number;

  @ApiProperty({ description: '호실', example: '401' })
  @IsNotEmpty({ message: '호실을 입력해주세요.' })
  @IsString()
  roomNo: string;

  @ApiProperty({ description: '보호자 연락처', example: '010-1234-5678' })
  @IsNotEmpty({ message: '보호자 연락처를 입력해주세요.' })
  @IsString()
  guardianPhone: string;

  @ApiPropertyOptional({ description: '방 타입', example: '2인실' })
  @IsOptional()
  @IsString()
  roomType?: string;

  @ApiPropertyOptional({ description: '성별', example: '남' })
  @IsOptional()
  @IsString()
  sex?: string;

  @ApiPropertyOptional({ description: '학과', example: '컴퓨터공학과' })
  @IsOptional()
  @IsString()
  dept?: string;

  @ApiPropertyOptional({ description: '학년', example: 2 })
  @IsOptional()
  @IsNumber()
  grade?: number;

  @ApiPropertyOptional({ description: '연락처', example: '010-5678-1234' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: '이메일', example: 'student@example.com' })
  @IsOptional()
  @IsString()
  email?: string;
}
