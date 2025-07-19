# TrailTag

QR 코드를 활용한 프로그램 출석 관리 시스템

## 개요

TrailTag는 QR 코드 스캔을 통해 프로그램 참여를 관리하는 웹 애플리케이션입니다. 관리자, 학생, 부모 역할을 지원하며 프로그램 생성, 출석 체크, 활동 모니터링 기능을 제공합니다.

## 기능

- **관리자**: 프로그램 생성/관리, QR 코드 생성, 사용자 관리
- **학생**: QR 코드 스캔으로 프로그램 체크인, 활동 기록 조회
- **부모**: 자녀 활동 모니터링, 참여 통계 확인

## 기술 스택

### Frontend
- React 19.1.0
- Material-UI (MUI) 7.2.0
- React Router DOM 7.7.0
- Vite (빌드 도구)

### Backend
- Node.js
- Express 5.1.0
- SQLite (better-sqlite3)
- JWT 인증

### QR 코드
- html5-qrcode (스캔)
- qrcode (생성)

## 설치 및 실행

### 요구사항
- Node.js 18 이상
- npm

### 설치
```bash
git clone https://github.com/hurxxxx/trailtag.git
cd trailtag
npm install
```

### 개발 환경 실행
```bash
# 개발 서버 시작 (HTTP - 기본)
npm run start

# 개발 서버 시작 (HTTPS - 모바일 QR 스캔 테스트용)
npm run start:https
```

**참고**:
- 일반 개발은 `npm run start` (HTTP) 사용
- 모바일에서 QR 스캔 테스트가 필요한 경우만 `npm run start:https` 사용

### 프로덕션 빌드 및 배포
```bash
# 프로덕션 빌드
npm run build:prod

# 프로덕션 서버 시작
npm run server:prod

# 또는 한 번에 빌드 + 배포
npm run deploy
```

## 접속 정보

### 개발 환경
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- HTTPS 모드: https://localhost:5173 (QR 스캔 테스트용)

### 프로덕션 환경
- 통합 서버: http://localhost:9883

### 기본 관리자 계정
- 사용자명: `admin`
- 비밀번호: `admin123`


## 환경 설정

- `.env` - 개발 환경 설정
- `.env.production` - 프로덕션 환경 설정

### API URL 설정
- **개발 환경**: `VITE_API_URL=http://localhost:3001/api`
- **프로덕션 환경**: `VITE_API_URL=/api` (상대 경로)

## 사용법

자세한 사용법은 [매뉴얼](MANUAL.md)을 참조하세요.

## 라이선스

MIT
