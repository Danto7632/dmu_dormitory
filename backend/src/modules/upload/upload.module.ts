import { Module, forwardRef } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { memoryStorage } from 'multer';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { StudentModule } from '../student/student.module';

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'default-secret'),
      }),
      inject: [ConfigService],
    }),
    forwardRef(() => StudentModule),
  ],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
