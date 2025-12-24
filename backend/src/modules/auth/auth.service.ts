import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Student } from '../student/entities/student.entity';
import { Admin } from '../admin/entities/admin.entity';
import { StudentLoginDto } from './dto/student-login.dto';
import { AdminLoginDto } from './dto/admin-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
  ) {}

  async studentLogin(dto: StudentLoginDto) {
    const student = await this.studentRepository.findOne({
      where: { hakbun: dto.hakbun },
    });
    
    if (!student) {
      throw new UnauthorizedException('학번 또는 비밀번호가 일치하지 않습니다.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, student.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('학번 또는 비밀번호가 일치하지 않습니다.');
    }

    const payload = {
      sub: student.hakbun,
      type: 'student',
      name: student.name,
    };

    return {
      access_token: this.jwtService.sign(payload),
      student: {
        hakbun: student.hakbun,
        name: student.name,
        floor: student.floor,
        roomNo: student.roomNo,
        guardianPhone: student.guardianPhone,
      },
    };
  }

  async adminLogin(dto: AdminLoginDto) {
    const admin = await this.adminRepository.findOne({
      where: { username: dto.username },
    });
    
    if (!admin) {
      throw new UnauthorizedException('아이디 또는 비밀번호가 일치하지 않습니다.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, admin.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('아이디 또는 비밀번호가 일치하지 않습니다.');
    }

    if (!admin.isActive) {
      throw new UnauthorizedException('비활성화된 계정입니다.');
    }

    const payload = {
      sub: admin.id,
      type: 'admin',
      username: admin.username,
      name: admin.name,
    };

    return {
      access_token: this.jwtService.sign(payload),
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
      },
    };
  }
}
