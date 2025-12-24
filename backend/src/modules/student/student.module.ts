import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Student } from './entities/student.entity';
import { StudentService } from './student.service';
import { StudentController } from './student.controller';
import { LeaveRequestModule } from '../leave-request/leave-request.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { LeaveRequest } from '../leave-request/entities/leave-request.entity';
import { AuditLog } from '../audit-log/entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Student, LeaveRequest, AuditLog]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'default-secret'),
      }),
      inject: [ConfigService],
    }),
    forwardRef(() => LeaveRequestModule),
    forwardRef(() => AuditLogModule),
  ],
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService],
})
export class StudentModule {}
