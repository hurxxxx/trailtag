import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    // HTTPS는 --https 플래그로 필요시에만 활성화
    // 모바일 QR 스캔 테스트시: npm run dev:https
  },
  define: {
    // 환경 변수를 명시적으로 정의
    __DEV__: mode !== 'production',
  }
}))
