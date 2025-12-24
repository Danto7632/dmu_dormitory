import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Admin } from './entities/admin.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { StudentModule } from '../student/student.module';
import { LeaveRequestModule } from '../leave-request/leave-request.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'default-secret'),
      }),
      inject: [ConfigService],
    }),
    forwardRef(() => StudentModule),
    forwardRef(() => LeaveRequestModule),
    forwardRef(() => AuditLogModule),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
