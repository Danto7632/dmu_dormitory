import { Injectable, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { StudentService } from '../student/student.service';
import { Student } from '../student/entities/student.entity';

interface ExcelRow {
  No?: number;
  Floor: number | string;
  Room_No: string | number;
  Room_Type?: string;
  Hakbun: string;
  Name: string;
  Sex?: string;
  Dept?: string;
  Grade?: number | string;
  Phone?: string;
  'E-mail'?: string;
  Guardian_Phone: string;
}

@Injectable()
export class UploadService {
  constructor(private readonly studentService: StudentService) {}

  async parseExcelFile(file: Express.Multer.File): Promise<{
    success: number;
    failed: number;
    errors: { row: number; error: string }[];
  }> {
    if (!file) {
      throw new BadRequestException('파일이 없습니다.');
    }

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);

    if (data.length === 0) {
      throw new BadRequestException('엑셀 파일에 데이터가 없습니다.');
    }

    const studentsData: Partial<Student>[] = [];
    const errors: { row: number; error: string }[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2; // 헤더 + 1부터 시작

      try {
        // 필수 필드 검증
        if (!row.Floor) {
          errors.push({ row: rowNum, error: 'Floor(층)이 필요합니다.' });
          continue;
        }
        if (!row.Room_No) {
          errors.push({ row: rowNum, error: 'Room_No(호실)가 필요합니다.' });
          continue;
        }
        if (!row.Hakbun) {
          errors.push({ row: rowNum, error: 'Hakbun(학번)이 필요합니다.' });
          continue;
        }
        if (!row.Name) {
          errors.push({ row: rowNum, error: 'Name(이름)이 필요합니다.' });
          continue;
        }
        if (!row.Guardian_Phone) {
          errors.push({ row: rowNum, error: 'Guardian_Phone(보호자연락처)가 필요합니다.' });
          continue;
        }

        // Floor 검증 (2~9층)
        const floor = typeof row.Floor === 'string' 
          ? parseInt(row.Floor.replace(/[^0-9]/g, ''), 10) 
          : row.Floor;
        
        if (floor < 2 || floor > 9) {
          errors.push({ row: rowNum, error: 'Floor는 2~9층만 허용됩니다.' });
          continue;
        }

        // Room_No 검증 (201~905)
        const roomNo = String(row.Room_No);
        const roomNumeric = parseInt(roomNo, 10);
        if (roomNumeric < 201 || roomNumeric > 905) {
          errors.push({ row: rowNum, error: 'Room_No는 201~905만 허용됩니다.' });
          continue;
        }

        // Floor-Room 정합성 검증
        const roomFloor = Math.floor(roomNumeric / 100);
        if (roomFloor !== floor) {
          errors.push({ 
            row: rowNum, 
            error: `Floor(${floor}층)와 Room_No(${roomNo})가 일치하지 않습니다.` 
          });
          continue;
        }

        const studentData: Partial<Student> = {
          hakbun: String(row.Hakbun).trim(),
          name: String(row.Name).trim(),
          floor,
          roomNo,
          roomType: row.Room_Type ? String(row.Room_Type) : null,
          sex: row.Sex ? String(row.Sex) : null,
          dept: row.Dept ? String(row.Dept) : null,
          grade: row.Grade ? (typeof row.Grade === 'string' ? parseInt(row.Grade, 10) : row.Grade) : null,
          phone: row.Phone ? String(row.Phone) : null,
          email: row['E-mail'] ? String(row['E-mail']) : null,
          guardianPhone: String(row.Guardian_Phone).trim(),
          no: row.No ? (typeof row.No === 'string' ? parseInt(row.No, 10) : row.No) : null,
        };

        studentsData.push(studentData);
      } catch (error) {
        errors.push({ row: rowNum, error: `파싱 오류: ${error.message}` });
      }
    }

    // Bulk upsert
    const result = await this.studentService.bulkUpsert(studentsData);

    return {
      success: result.success,
      failed: result.failed + errors.length,
      errors: [...errors, ...result.errors],
    };
  }

  generateTemplate(): Buffer {
    const templateData = [
      {
        No: 1,
        Floor: 2,
        Room_No: '201',
        Room_Type: '2인실',
        Hakbun: '20231001',
        Name: '홍길동',
        Sex: '남',
        Dept: '컴퓨터공학과',
        Grade: 1,
        Phone: '010-1234-5678',
        'E-mail': 'hong@example.com',
        Guardian_Phone: '010-8765-4321',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}
