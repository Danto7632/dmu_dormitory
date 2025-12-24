import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, LessThan, MoreThan } from 'typeorm';
import { LeaveRequest } from './entities/leave-request.entity';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestDto } from './dto/update-leave-request.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { ActionType } from '../audit-log/entities/audit-log.entity';

@Injectable()
export class LeaveRequestService {
  constructor(
    @InjectRepository(LeaveRequest)
    private readonly leaveRequestRepository: Repository<LeaveRequest>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(hakbun: string, dto: CreateLeaveRequestDto): Promise<LeaveRequest> {
    // 활성 외박 체크 (중복 방지)
    const activeLeave = await this.getActiveLeave(hakbun);
    if (activeLeave) {
      throw new BadRequestException('이미 활성화된 외박 신청이 있습니다.');
    }

    const leaveRequest = this.leaveRequestRepository.create({
      hakbun,
      leaveStart: new Date(dto.leaveStart),
      expectedReturn: new Date(dto.expectedReturn),
      reason: dto.reason,
    });

    const saved = await this.leaveRequestRepository.save(leaveRequest);

    // 감사 로그 기록
    await this.auditLogService.create({
      actorHakbun: hakbun,
      actionType: ActionType.APPLY,
      leaveRequestId: saved.id,
      payloadAfter: saved,
    });

    return saved;
  }

  async update(
    hakbun: string,
    id: number,
    dto: UpdateLeaveRequestDto,
  ): Promise<LeaveRequest> {
    const leaveRequest = await this.leaveRequestRepository.findOne({
      where: { id, hakbun, isDeleted: false, actualReturn: IsNull() },
    });

    if (!leaveRequest) {
      throw new NotFoundException('수정할 외박 신청을 찾을 수 없습니다.');
    }

    const before = { ...leaveRequest };

    if (dto.leaveStart) {
      leaveRequest.leaveStart = new Date(dto.leaveStart);
    }
    if (dto.expectedReturn) {
      leaveRequest.expectedReturn = new Date(dto.expectedReturn);
    }
    if (dto.reason) {
      leaveRequest.reason = dto.reason;
    }

    const saved = await this.leaveRequestRepository.save(leaveRequest);

    // 감사 로그 기록
    await this.auditLogService.create({
      actorHakbun: hakbun,
      actionType: ActionType.EDIT,
      leaveRequestId: saved.id,
      payloadBefore: before,
      payloadAfter: saved,
    });

    return saved;
  }

  async delete(hakbun: string, id: number): Promise<void> {
    const leaveRequest = await this.leaveRequestRepository.findOne({
      where: { id, hakbun, isDeleted: false, actualReturn: IsNull() },
    });

    if (!leaveRequest) {
      throw new NotFoundException('삭제할 외박 신청을 찾을 수 없습니다.');
    }

    const before = { ...leaveRequest };

    leaveRequest.isDeleted = true;
    leaveRequest.deletedAt = new Date();

    await this.leaveRequestRepository.save(leaveRequest);

    // 감사 로그 기록
    await this.auditLogService.create({
      actorHakbun: hakbun,
      actionType: ActionType.DELETE,
      leaveRequestId: id,
      payloadBefore: before,
    });
  }

  async returnHome(hakbun: string, id: number): Promise<LeaveRequest> {
    const leaveRequest = await this.leaveRequestRepository.findOne({
      where: { id, hakbun, isDeleted: false, actualReturn: IsNull() },
    });

    if (!leaveRequest) {
      throw new NotFoundException('귀사 처리할 외박 신청을 찾을 수 없습니다.');
    }

    const before = { ...leaveRequest };

    leaveRequest.actualReturn = new Date();

    const saved = await this.leaveRequestRepository.save(leaveRequest);

    // 감사 로그 기록
    await this.auditLogService.create({
      actorHakbun: hakbun,
      actionType: ActionType.RETURN,
      leaveRequestId: saved.id,
      payloadBefore: before,
      payloadAfter: saved,
    });

    return saved;
  }

  async getActiveLeave(hakbun: string): Promise<LeaveRequest | null> {
    return this.leaveRequestRepository.findOne({
      where: {
        hakbun,
        isDeleted: false,
        actualReturn: IsNull(),
      },
    });
  }

  async findByHakbun(
    hakbun: string,
    query?: { page?: number; limit?: number },
  ): Promise<{ data: LeaveRequest[]; total: number }> {
    const page = query?.page || 1;
    const limit = query?.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await this.leaveRequestRepository.findAndCount({
      where: { hakbun },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total };
  }

  async findAll(query?: {
    status?: 'active' | 'returned' | 'deleted' | 'all';
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: LeaveRequest[]; total: number }> {
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.leaveRequestRepository
      .createQueryBuilder('leave')
      .leftJoinAndSelect('leave.student', 'student');

    if (query?.status === 'active') {
      queryBuilder
        .andWhere('leave.isDeleted = :isDeleted', { isDeleted: false })
        .andWhere('leave.actualReturn IS NULL');
    } else if (query?.status === 'returned') {
      queryBuilder
        .andWhere('leave.isDeleted = :isDeleted', { isDeleted: false })
        .andWhere('leave.actualReturn IS NOT NULL');
    } else if (query?.status === 'deleted') {
      queryBuilder.andWhere('leave.isDeleted = :isDeleted', { isDeleted: true });
    }

    if (query?.search) {
      queryBuilder.andWhere(
        '(student.hakbun LIKE :search OR student.name LIKE :search OR student.roomNo LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    queryBuilder.orderBy('leave.createdAt', 'DESC');

    const [data, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    return { data, total };
  }

  async getCurrentStatus(): Promise<{
    inDorm: number;
    onLeave: number;
    overdue: number;
    onLeaveList: LeaveRequest[];
    inDormList: any[];
  }> {
    const now = new Date();

    // 외박 중인 학생들
    const onLeaveList = await this.leaveRequestRepository.find({
      where: {
        isDeleted: false,
        actualReturn: IsNull(),
      },
      relations: ['student'],
      order: { expectedReturn: 'ASC' },
    });

    const onLeave = onLeaveList.length;

    // 외박 중인 학생 학번들
    const onLeaveHakbuns = onLeaveList.map(l => l.hakbun);

    // 전체 학생 수에서 외박 중인 학생 제외
    const studentRepository = this.leaveRequestRepository.manager.getRepository('students');
    const totalStudents = await studentRepository.count();
    const inDorm = totalStudents - onLeave;

    // 기숙사 내 학생 목록 (외박 중이 아닌 학생들)
    let inDormList: any[] = [];
    if (onLeaveHakbuns.length > 0) {
      inDormList = await studentRepository
        .createQueryBuilder('student')
        .where('student.hakbun NOT IN (:...hakbuns)', { hakbuns: onLeaveHakbuns })
        .orderBy('student.floor', 'ASC')
        .addOrderBy('student.room_no', 'ASC')
        .getMany();
    } else {
      inDormList = await studentRepository
        .createQueryBuilder('student')
        .orderBy('student.floor', 'ASC')
        .addOrderBy('student.room_no', 'ASC')
        .getMany();
    }

    // 귀사예정 초과자
    const overdue = onLeaveList.filter(
      (leave) => new Date(leave.expectedReturn) < now,
    ).length;

    return { inDorm, onLeave, overdue, onLeaveList, inDormList };
  }

  async findOne(id: number): Promise<LeaveRequest> {
    const leave = await this.leaveRequestRepository.findOne({
      where: { id },
      relations: ['student'],
    });

    if (!leave) {
      throw new NotFoundException('외박 신청을 찾을 수 없습니다.');
    }

    return leave;
  }
}
