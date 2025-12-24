import { IsNotEmpty, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLeaveRequestDto {
  @ApiProperty({
    description: '외박 시작 일시 (ISO 8601 형식)',
    example: '2025-12-22T18:00:00.000Z',
  })
  @IsNotEmpty({ message: '외박일시를 입력해주세요.' })
  @IsDateString({}, { message: '올바른 날짜 형식이 아닙니다.' })
  leaveStart: string;

  @ApiProperty({
    description: '귀사 예정 일시 (ISO 8601 형식)',
    example: '2025-12-23T22:00:00.000Z',
  })
  @IsNotEmpty({ message: '귀사예정일시를 입력해주세요.' })
  @IsDateString({}, { message: '올바른 날짜 형식이 아닙니다.' })
  expectedReturn: string;

  @ApiProperty({
    description: '외박 사유',
    example: '가족 행사 참석',
  })
  @IsNotEmpty({ message: '사유를 입력해주세요.' })
  @IsString()
  reason: string;
}
