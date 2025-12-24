import { IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLeaveRequestDto {
  @ApiPropertyOptional({
    description: '외박 시작 일시 (ISO 8601 형식)',
    example: '2025-12-22T18:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: '올바른 날짜 형식이 아닙니다.' })
  leaveStart?: string;

  @ApiPropertyOptional({
    description: '귀사 예정 일시 (ISO 8601 형식)',
    example: '2025-12-23T22:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: '올바른 날짜 형식이 아닙니다.' })
  expectedReturn?: string;

  @ApiPropertyOptional({
    description: '외박 사유',
    example: '가족 행사 참석',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
