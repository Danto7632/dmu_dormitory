import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminLoginDto {
  @ApiProperty({
    description: '관리자 아이디',
    example: 'admin',
  })
  @IsNotEmpty({ message: '아이디를 입력해주세요.' })
  @IsString()
  username: string;

  @ApiProperty({
    description: '비밀번호',
    example: 'admin123',
  })
  @IsNotEmpty({ message: '비밀번호를 입력해주세요.' })
  @IsString()
  password: string;
}
