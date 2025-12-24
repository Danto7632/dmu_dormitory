import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StudentLoginDto {
  @ApiProperty({
    description: '학번',
    example: '20231234',
  })
  @IsNotEmpty({ message: '학번을 입력해주세요.' })
  @IsString()
  hakbun: string;

  @ApiProperty({
    description: '비밀번호 (기본값: 방번호3자리 + 전화번호뒷자리4자리)',
    example: '1011234',
  })
  @IsNotEmpty({ message: '비밀번호를 입력해주세요.' })
  @IsString()
  password: string;
}
