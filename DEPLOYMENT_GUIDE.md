# TrailTag 배포 가이드

## 📋 개요
TrailTag 애플리케이션을 프로덕션 환경에 배포하기 위한 가이드입니다.

## 🚀 프로덕션 빌드 및 배포

### 1. 프로덕션 빌드
```bash
# 프론트엔드 프로덕션 빌드
npm run build:prod

# 빌드 결과 확인
ls -la dist/
```

### 2. 프로덕션 서버 시작
```bash
# 프로덕션 서버 시작
node start-production.js

# 또는 npm 스크립트 사용
npm run server:prod
```

### 3. 서버 상태 확인
```bash
# Health check
curl http://localhost:9883/api/health

# 서버 로그 확인
tail -f server.log
```

### 4. UI 접근
프로덕션 환경에서는 단일 포트(9883)로 모든 서비스에 접근할 수 있습니다:

```bash
# 웹 UI 접근
http://localhost:9883

# API 접근
http://localhost:9883/api/health
http://localhost:9883/api/auth/login
```

**주요 URL:**
- **메인 애플리케이션**: http://localhost:9883
- **로그인 페이지**: http://localhost:9883/auth
- **관리자 대시보드**: http://localhost:9883/admin
- **학생 대시보드**: http://localhost:9883/student
- **학부모 대시보드**: http://localhost:9883/parent
- **API Health Check**: http://localhost:9883/api/health

## ⚙️ 환경 설정

### 서버 포트
- **개발환경**: 3001
- **프로덕션**: 9883

### 환경변수 파일
- `.env` - 개발환경 설정
- `.env.production` - 프론트엔드 프로덕션 설정
- `.env.server.production` - 서버 프로덕션 설정

### 중요 설정 변경사항
1. **JWT_SECRET**: 프로덕션에서 반드시 변경
2. **FRONTEND_URL**: 실제 도메인으로 변경
3. **CORS 설정**: 허용할 도메인 설정

## 📁 디렉토리 구조
```
trailtag/
├── dist/                 # 프로덕션 빌드 결과
├── server/               # 백엔드 서버
├── data/                 # SQLite 데이터베이스
├── .env.production       # 프론트엔드 프로덕션 환경변수
├── .env.server.production # 서버 프로덕션 환경변수
└── start-production.js   # 프로덕션 서버 시작 스크립트
```

## 🔧 배포 스크립트

### 사용 가능한 npm 스크립트
```bash
npm run build:prod      # 프로덕션 빌드
npm run server:prod     # 프로덕션 서버 시작
npm run start:prod      # 빌드 + 서버 시작
npm run deploy          # 전체 배포 프로세스
```

## 🛡️ 보안 고려사항

### 1. JWT Secret 변경
```bash
# .env.server.production에서 변경
JWT_SECRET=your-very-long-and-secure-random-string-here
```

### 2. CORS 설정
```bash
# 실제 도메인으로 변경
FRONTEND_URL=https://your-domain.com
```

### 3. Rate Limiting
프로덕션 환경에서는 자동으로 Rate Limiting이 활성화됩니다.

## 📊 모니터링

### Health Check Endpoint
```
GET http://localhost:9883/api/health
```

### 로그 모니터링
서버는 Morgan을 사용하여 모든 요청을 로깅합니다.

## 🔄 업데이트 프로세스

1. 코드 변경사항 커밋
2. 프로덕션 빌드 실행
3. 서버 재시작
4. Health check 확인

```bash
git pull origin main
npm run build:prod
pm2 restart trailtag  # PM2 사용 시
# 또는
node start-production.js
```
