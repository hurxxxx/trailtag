#!/bin/bash

# TrailTag 백그라운드 실행 스크립트

# 로그 디렉토리 생성
mkdir -p logs

# 백그라운드에서 실행하고 로그 저장
echo "TrailTag 애플리케이션을 백그라운드에서 시작합니다..."
npm install
nohup npm run deploy > logs/app.log 2>&1 &

# PID 저장
echo $! > logs/app.pid

echo "애플리케이션이 백그라운드에서 실행 중입니다."
echo "PID: $(cat logs/app.pid)"
echo "로그 확인: tail -f logs/app.log"
echo "중지하려면: ./scripts/stop.sh"

