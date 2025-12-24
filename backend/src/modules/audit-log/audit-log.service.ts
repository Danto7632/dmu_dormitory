import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AuditLog, ActionType } from './entities/audit-log.entity';

interface CreateAuditLogDto {
  actorHakbun: string;
  actionType: ActionType;
  leaveRequestId?: number;
  payloadBefore?: any;
  payloadAfter?: any;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async create(dto: CreateAuditLogDto): Promise<AuditLog> {
    const log = this.auditLogRepository.create(dto);
    return this.auditLogRepository.save(log);
  }

  async findOne(id: number): Promise<AuditLog> {
    const log = await this.auditLogRepository.findOne({
      where: { id },
      relations: ['student'],
    });

    if (!log) {
      throw new NotFoundException('로그를 찾을 수 없습니다.');
    }

    return log;
  }

  // 특정 외박신청에 대한 모든 로그 조회
  async findByLeaveRequestId(leaveRequestId: number): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { leaveRequestId },
      relations: ['student'],
      order: { createdAt: 'ASC' },
    });
  }

  async findByHakbun(
    hakbun: string,
    query?: { page?: number; limit?: number },
  ): Promise<{ data: AuditLog[]; total: number }> {
    const page = query?.page || 1;
    const limit = query?.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await this.auditLogRepository.findAndCount({
      where: { actorHakbun: hakbun },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total };
  }

  async findAll(query?: {
    actionType?: ActionType;
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: AuditLog[]; total: number }> {
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.student', 'student');

    if (query?.actionType) {
      queryBuilder.andWhere('log.actionType = :actionType', {
        actionType: query.actionType,
      });
    }

    if (query?.search) {
      queryBuilder.andWhere(
        '(student.hakbun LIKE :search OR student.name LIKE :search OR student.roomNo LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query?.startDate && query?.endDate) {
      queryBuilder.andWhere('log.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate + ' 23:59:59'),
      });
    } else if (query?.startDate) {
      queryBuilder.andWhere('log.createdAt >= :startDate', {
        startDate: new Date(query.startDate),
      });
    } else if (query?.endDate) {
      queryBuilder.andWhere('log.createdAt <= :endDate', {
        endDate: new Date(query.endDate + ' 23:59:59'),
      });
    }

    queryBuilder.orderBy('log.createdAt', 'DESC');

    const [data, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    return { data, total };
  }

  async getStats(): Promise<{
    today: number;
    thisWeek: number;
    byType: { type: ActionType; count: number }[];
  }> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const today = await this.auditLogRepository.count({
      where: { createdAt: Between(todayStart, now) },
    });

    const thisWeek = await this.auditLogRepository.count({
      where: { createdAt: Between(weekStart, now) },
    });

    const byTypeRaw = await this.auditLogRepository
      .createQueryBuilder('log')
      .select('log.actionType', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.actionType')
      .getRawMany();

    const byType = byTypeRaw.map((item) => ({
      type: item.type as ActionType,
      count: parseInt(item.count, 10),
    }));

    return { today, thisWeek, byType };
  }
}
