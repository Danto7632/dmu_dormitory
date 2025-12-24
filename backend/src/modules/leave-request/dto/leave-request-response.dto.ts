import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LeaveRequestResponseDto {
  @ApiProperty({ example: 1, description: '외박 신청 ID' })
  id: number;

  @ApiProperty({ example: '20231234', description: '학번' })
  hakbun: string;

  @ApiProperty({ example: '2025-12-22T18:00:00.000Z', description: '외박 시작 일시' })
  leaveStart: string;

  @ApiProperty({ example: '2025-12-23T22:00:00.000Z', description: '귀사 예정 일시' })
  expectedReturn: string;

  @ApiProperty({ example: '가족 행사 참석', description: '외박 사유' })
  reason: string;

  @ApiPropertyOptional({ example: '2025-12-23T21:30:00.000Z', description: '실제 귀사 일시' })
  actualReturn?: string;

  @ApiProperty({ example: false, description: '삭제 여부' })
  isDeleted: boolean;

  @ApiPropertyOptional({ example: '2025-12-22T10:00:00.000Z', description: '삭제 일시' })
  deletedAt?: string;

  @ApiProperty({ example: '2025-12-22T10:00:00.000Z', description: '생성 일시' })
  createdAt: string;

  @ApiProperty({ example: '2025-12-22T10:00:00.000Z', description: '수정 일시' })
  updatedAt: string;
}

export class LeaveRequestListResponseDto {
  @ApiProperty({ type: [LeaveRequestResponseDto] })
  data: LeaveRequestResponseDto[];

  @ApiProperty({ example: 100, description: '총 개수' })
  total: number;

  @ApiProperty({ example: 1, description: '현재 페이지' })
  page: number;

  @ApiProperty({ example: 20, description: '페이지당 개수' })
  limit: number;
}
