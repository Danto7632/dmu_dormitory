import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Admin } from './entities/admin.entity';

@Injectable()
export class AdminService implements OnModuleInit {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
  ) {}

  async onModuleInit() {
    // 기본 관리자 계정 생성 (없는 경우에만)
    const existingAdmin = await this.adminRepository.findOne({
      where: { username: 'admin' },
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = this.adminRepository.create({
        username: 'admin',
        password: hashedPassword,
        name: '관리자',
        isActive: true,
      });
      await this.adminRepository.save(admin);
      console.log('기본 관리자 계정이 생성되었습니다. (admin / admin123)');
    }
  }

  async findByUsername(username: string): Promise<Admin | null> {
    return this.adminRepository.findOne({ where: { username } });
  }

  async findById(id: number): Promise<Admin | null> {
    return this.adminRepository.findOne({ where: { id } });
  }

  async create(data: {
    username: string;
    password: string;
    name: string;
  }): Promise<Admin> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const admin = this.adminRepository.create({
      ...data,
      password: hashedPassword,
    });
    return this.adminRepository.save(admin);
  }

  async updatePassword(id: number, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.adminRepository.update(id, { password: hashedPassword });
  }
}
