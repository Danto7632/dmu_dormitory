import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'dmu_dormitory',
});

async function seed() {
  try {
    await dataSource.initialize();
    console.log('Database connected');

    // 기본 관리자 계정 생성
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Admin 테이블에 기본 관리자가 있는지 확인
    const existingAdmin = await dataSource.query(
      'SELECT * FROM admins WHERE username = ?',
      ['admin']
    );

    if (existingAdmin.length === 0) {
      await dataSource.query(
        `INSERT INTO admins (username, password, name, is_active, created_at, updated_at) 
         VALUES (?, ?, ?, ?, NOW(), NOW())`,
        ['admin', hashedPassword, '관리자', true]
      );
      console.log('✅ 기본 관리자 계정이 생성되었습니다.');
      console.log('   아이디: admin');
      console.log('   비밀번호: admin123');
    } else {
      console.log('ℹ️ 기본 관리자 계정이 이미 존재합니다.');
    }

    // 테스트 학생 계정 생성
    const existingStudent = await dataSource.query(
      'SELECT * FROM students WHERE hakbun = ?',
      ['20231234']
    );

    if (existingStudent.length === 0) {
      await dataSource.query(
        `INSERT INTO students (hakbun, name, floor, room_no, guardian_phone, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        ['20231234', '홍길동', 4, '401', '010-1234-5678']
      );
      console.log('✅ 테스트 학생 계정이 생성되었습니다.');
      console.log('   학번: 20231234');
    } else {
      console.log('ℹ️ 테스트 학생 계정이 이미 존재합니다.');
    }

    await dataSource.destroy();
    console.log('\n시드 완료!');
  } catch (error) {
    console.error('시드 오류:', error);
    process.exit(1);
  }
}

seed();
