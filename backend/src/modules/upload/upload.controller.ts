import {
  Controller,
  Post,
  Get,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { UploadService } from './upload.service';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @UseGuards(AdminGuard)
  @Post('students')
  @UseInterceptors(FileInterceptor('file'))
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '학생 엑셀 업로드', description: '엑셀 파일로 학생 데이터를 일괄 등록합니다.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadStudents(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.parseExcelFile(file);
  }

  @UseGuards(AdminGuard)
  @Get('template')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '학생 템플릿 다운로드', description: '학생 등록용 엑셀 템플릿을 다운로드합니다.' })
  async downloadTemplate(@Res() res: Response) {
    const buffer = this.uploadService.generateTemplate();
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=student_template.xlsx',
    });
    
    res.send(buffer);
  }
}
