#!/bin/bash

# TrailTag 중지 스크립트

# 프로젝트 루트로 이동
cd "$(dirname "$0")/.."

# PID 파일 확인
if [ -f logs/app.pid ]; then
    PID=$(cat logs/app.pid)
    
    # 프로세스가 실행 중인지 확인
    if kill -0 $PID 2>/dev/null; then
        echo "애플리케이션을 중지합니다... (PID: $PID)"
        kill $PID
        
        # 프로세스 종료 대기
        sleep 3
        
        # 강제 종료가 필요한 경우
        if kill -0 $PID 2>/dev/null; then
            echo "강제 종료합니다..."
            kill -9 $PID
        fi
        
        echo "애플리케이션이 중지되었습니다."
    else
        echo "애플리케이션이 실행 중이지 않습니다."
    fi
    
    # PID 파일 삭제
    rm -f logs/app.pid
else
    echo "PID 파일을 찾을 수 없습니다."
fi

# 포트 기반 정리 (백업)
echo "포트 정리 중..."
pkill -f "npm run deploy" 2>/dev/null || true
pkill -f "node server/server.js" 2>/dev/null || true
