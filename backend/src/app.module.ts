import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentModule } from './modules/student/student.module';
import { LeaveRequestModule } from './modules/leave-request/leave-request.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { UploadModule } from './modules/upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get('DB_USERNAME', 'root'),
        password: configService.get('DB_PASSWORD', ''),
        database: configService.get('DB_DATABASE', 'dmu_dormitory'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // 개발 환경에서만 true
        timezone: '+09:00',
        charset: 'utf8mb4',
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    StudentModule,
    LeaveRequestModule,
    AuditLogModule,
    AdminModule,
    UploadModule,
  ],
})
export class AppModule {}
