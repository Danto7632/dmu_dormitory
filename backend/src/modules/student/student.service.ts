import { Injectable, NotFoundException, ConflictException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, IsNull, Or, Equal } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Student } from './entities/student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { LeaveRequest } from '../leave-request/entities/leave-request.entity';
import { AuditLog } from '../audit-log/entities/audit-log.entity';

@Injectable()
export class StudentService implements OnModuleInit {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(LeaveRequest)
    private readonly leaveRequestRepository: Repository<LeaveRequest>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  // 모듈 초기화 시 비밀번호가 없는 학생들에게 비밀번호 생성
  async onModuleInit() {
    try {
      // 비밀번호가 없거나 빈 문자열인 학생들 조회
      const studentsWithoutPassword = await this.studentRepository
        .createQueryBuilder('student')
        .where('student.password IS NULL')
        .orWhere('student.password = :empty', { empty: '' })
        .getMany();

      if (studentsWithoutPassword.length > 0) {
        console.log(`비밀번호가 없는 학생 ${studentsWithoutPassword.length}명 발견. 비밀번호 생성 중...`);
        
        for (const student of studentsWithoutPassword) {
          const plainPassword = this.generatePassword(student.roomNo, student.phone || '');
          const hashedPassword = await bcrypt.hash(plainPassword, 10);
          await this.studentRepository.update(student.hakbun, { password: hashedPassword });
        }
        
        console.log('학생 비밀번호 생성 완료');
      }
    } catch (error) {
      // 테이블이 아직 없는 경우 등 에러 무시
      console.log('학생 비밀번호 마이그레이션 스킵 (새 테이블일 수 있음)');
    }
  }

  // 비밀번호 생성: 방번호(3자리) + 전화번호 뒷자리(4자리)
  private generatePassword(roomNo: string, phone: string): string {
    // 방번호에서 숫자만 추출하여 3자리로 (예: "101" -> "101", "101호" -> "101")
    const roomDigits = roomNo.replace(/\D/g, '').padStart(3, '0').slice(-3);
    
    // 전화번호에서 숫자만 추출하여 뒷 4자리 (예: "010-1234-5678" -> "5678")
    const phoneDigits = phone ? phone.replace(/\D/g, '').slice(-4).padStart(4, '0') : '0000';
    
    return roomDigits + phoneDigits;
  }

  async findByHakbun(hakbun: string): Promise<Student | null> {
    return this.studentRepository.findOne({ where: { hakbun } });
  }

  async findAll(query?: {
    search?: string;
    floor?: number;
    page?: number;
    limit?: number;
  }): Promise<{ data: Student[]; total: number; page: number; limit: number }> {
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.studentRepository.createQueryBuilder('student');

    if (query?.search) {
      queryBuilder.andWhere(
        '(student.hakbun LIKE :search OR student.name LIKE :search OR student.roomNo LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query?.floor) {
      queryBuilder.andWhere('student.floor = :floor', { floor: query.floor });
    }

    queryBuilder.orderBy('student.floor', 'ASC').addOrderBy('student.roomNo', 'ASC');

    const [data, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(hakbun: string): Promise<Student> {
    const student = await this.studentRepository.findOne({
      where: { hakbun },
      relations: ['leaveRequests', 'auditLogs'],
    });

    if (!student) {
      throw new NotFoundException('학생을 찾을 수 없습니다.');
    }

    return student;
  }

  async create(dto: CreateStudentDto): Promise<Student> {
    const existing = await this.studentRepository.findOne({
      where: { hakbun: dto.hakbun },
    });

    if (existing) {
      throw new ConflictException('이미 등록된 학번입니다.');
    }

    // 비밀번호 자동 생성 및 해시
    const plainPassword = this.generatePassword(dto.roomNo, dto.phone || '');
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const student = this.studentRepository.create({
      ...dto,
      password: hashedPassword,
    });
    return this.studentRepository.save(student);
  }

  async update(hakbun: string, dto: UpdateStudentDto): Promise<Student> {
    const student = await this.studentRepository.findOne({
      where: { hakbun },
    });

    if (!student) {
      throw new NotFoundException('학생을 찾을 수 없습니다.');
    }

    // 방번호나 전화번호가 변경되면 비밀번호도 업데이트
    const newRoomNo = dto.roomNo || student.roomNo;
    const newPhone = dto.phone !== undefined ? dto.phone : student.phone;
    
    if (dto.roomNo || dto.phone !== undefined) {
      const plainPassword = this.generatePassword(newRoomNo, newPhone || '');
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      (dto as any).password = hashedPassword;
    }

    await this.studentRepository.update(hakbun, dto);
    return this.studentRepository.findOne({ where: { hakbun } });
  }

  async delete(hakbun: string): Promise<void> {
    const student = await this.studentRepository.findOne({
      where: { hakbun },
    });

    if (!student) {
      throw new NotFoundException('학생을 찾을 수 없습니다.');
    }

    // 관련 데이터 먼저 삭제 (외래 키 제약 조건 해결)
    await this.auditLogRepository.delete({ actorHakbun: hakbun });
    await this.leaveRequestRepository.delete({ hakbun });
    
    await this.studentRepository.delete(hakbun);
  }

  async upsert(studentData: Partial<Student>): Promise<Student> {
    const existing = await this.studentRepository.findOne({
      where: { hakbun: studentData.hakbun },
    });

    // 비밀번호 생성
    const plainPassword = this.generatePassword(
      studentData.roomNo || '',
      studentData.phone || '',
    );
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    if (existing) {
      // 기존 학생 업데이트 - 비밀번호도 갱신
      await this.studentRepository.update(existing.hakbun, {
        ...studentData,
        password: hashedPassword,
      });
      return this.studentRepository.findOne({ where: { hakbun: studentData.hakbun } });
    }

    // 새 학생 생성
    const student = this.studentRepository.create({
      ...studentData,
      password: hashedPassword,
    });
    return this.studentRepository.save(student);
  }

  async bulkUpsert(studentsData: Partial<Student>[]): Promise<{
    success: number;
    failed: number;
    errors: { row: number; error: string }[];
  }> {
    let success = 0;
    let failed = 0;
    const errors: { row: number; error: string }[] = [];

    for (let i = 0; i < studentsData.length; i++) {
      try {
        await this.upsert(studentsData[i]);
        success++;
      } catch (error) {
        failed++;
        errors.push({ row: i + 1, error: error.message });
      }
    }

    return { success, failed, errors };
  }

  async getCount(): Promise<number> {
    return this.studentRepository.count();
  }
}
