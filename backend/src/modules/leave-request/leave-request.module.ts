import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LeaveRequest } from './entities/leave-request.entity';
import { LeaveRequestService } from './leave-request.service';
import { LeaveRequestController } from './leave-request.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LeaveRequest]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'default-secret'),
      }),
      inject: [ConfigService],
    }),
    forwardRef(() => AuditLogModule),
  ],
  controllers: [LeaveRequestController],
  providers: [LeaveRequestService],
  exports: [LeaveRequestService],
})
export class LeaveRequestModule {}
