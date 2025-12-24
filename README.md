# 기숙사 외박/귀사 신고 시스템

기숙사 외박/귀사 신고를 위한 반응형 웹 애플리케이션입니다.

## 기술 스택

### 백엔드
- **NestJS** - Node.js 프레임워크
- **TypeORM** - ORM
- **MySQL** - 데이터베이스
- **JWT** - 인증

### 프론트엔드
- **React 18** - UI 라이브러리
- **TypeScript** - 타입 시스템
- **Vite** - 빌드 도구
- **TailwindCSS** - CSS 프레임워크
- **React Query** - 서버 상태 관리
- **Zustand** - 클라이언트 상태 관리
- **React Router** - 라우팅

## 시작하기

### 사전 요구사항
- Node.js 18+ 
- MySQL 8.0+
- npm 또는 yarn

### 1. 데이터베이스 설정

MySQL에 데이터베이스를 생성합니다:

```sql
CREATE DATABASE dmu_dormitory CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. 백엔드 설정

```bash
cd backend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 수정하여 DB 정보 입력

# 개발 서버 실행
npm run start:dev
```

백엔드는 기본적으로 http://localhost:3001 에서 실행됩니다.

### 3. 프론트엔드 설정

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

프론트엔드는 기본적으로 http://localhost:3000 에서 실행됩니다.

## 환경 변수

### 백엔드 (.env)

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=dmu_dormitory

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# App
PORT=3001
```

## 기본 계정

### 관리자 계정
서버 시작 시 자동으로 기본 관리자 계정이 생성됩니다:
- **아이디**: admin
- **비밀번호**: admin123

⚠️ 운영 환경에서는 반드시 비밀번호를 변경하세요!

### 학생 계정
학생은 관리자가 엑셀 파일로 업로드해야 로그인할 수 있습니다.

## URL 구조

### 학생용
- `/student/login` - 학생 로그인 (학번 입력)
- `/student/home` - 학생 홈 (외박 신청/수정/삭제/귀사)

### 관리자용
- `/admin/login` - 관리자 로그인
- `/admin/dashboard/status` - 현재 상태 대시보드
- `/admin/dashboard/logs` - 전체 로그
- `/admin/students` - 학생 관리
- `/admin/students/:hakbun` - 학생 상세 정보

## 주요 기능

### 학생
- 학번으로 간편 로그인
- 외박 신청 (외박일시, 귀사예정일시, 사유)
- 외박 수정/삭제 (외박 중일 때만)
- 귀사 완료 처리

### 관리자
- 아이디/비밀번호 로그인
- 현재 상태 대시보드 (기숙사 내/외박 중/초과자)
- 전체 로그 조회 (필터/검색)
- 학생 정보 엑셀 업로드
- 학생 상세 정보 조회

## 엑셀 업로드 형식

학생 정보는 다음 컬럼으로 구성된 엑셀 파일로 업로드합니다:

| 컬럼명 | 필수 | 설명 |
|--------|------|------|
| No | 선택 | 순번 |
| Floor | 필수 | 층 (2~9) |
| Room_No | 필수 | 호실 (201~905) |
| Room_Type | 선택 | 방 유형 |
| Hakbun | 필수 | 학번 |
| Name | 필수 | 이름 |
| Sex | 선택 | 성별 |
| Dept | 선택 | 학과 |
| Grade | 선택 | 학년 |
| Phone | 선택 | 연락처 |
| E-mail | 선택 | 이메일 |
| Guardian_Phone | 필수 | 보호자 연락처 |

관리자 페이지에서 템플릿을 다운로드할 수 있습니다.

## API 엔드포인트

### 인증
- `POST /api/auth/student/login` - 학생 로그인
- `POST /api/auth/admin/login` - 관리자 로그인

### 학생 (인증 필요)
- `GET /api/student/me` - 내 정보 조회
- `GET /api/student/my-leaves` - 내 외박 내역
- `GET /api/student/my-logs` - 내 활동 로그

### 외박 신청 (학생 인증 필요)
- `POST /api/leave-request` - 외박 신청
- `PUT /api/leave-request/:id` - 외박 수정
- `DELETE /api/leave-request/:id` - 외박 삭제
- `POST /api/leave-request/:id/return` - 귀사 완료

### 관리자 (관리자 인증 필요)
- `GET /api/admin/dashboard/status` - 현재 상태
- `GET /api/admin/dashboard/stats` - 통계
- `GET /api/admin/students` - 학생 목록
- `GET /api/admin/students/:hakbun` - 학생 상세
- `GET /api/admin/logs` - 전체 로그

### 업로드 (관리자 인증 필요)
- `GET /api/upload/template` - 템플릿 다운로드
- `POST /api/upload/students` - 학생 정보 업로드

## 프로젝트 구조

```
dmu_dormitory/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── admin/          # 관리자 모듈
│   │   │   ├── audit-log/      # 감사 로그 모듈
│   │   │   ├── auth/           # 인증 모듈
│   │   │   ├── leave-request/  # 외박 신청 모듈
│   │   │   ├── student/        # 학생 모듈
│   │   │   └── upload/         # 업로드 모듈
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── guards/         # 라우트 가드
    │   │   └── layout/         # 레이아웃
    │   ├── lib/
    │   │   └── api.ts          # API 클라이언트
    │   ├── pages/
    │   │   ├── admin/          # 관리자 페이지
    │   │   └── student/        # 학생 페이지
    │   ├── stores/             # 상태 관리
    │   ├── types/              # 타입 정의
    │   ├── App.tsx
    │   └── main.tsx
    └── package.json
```

## 라이선스

이 프로젝트는 비공개 프로젝트입니다.
