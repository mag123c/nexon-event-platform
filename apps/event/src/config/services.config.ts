import { registerAs } from '@nestjs/config';

// Auth 서비스 관련 설정
export const authServiceConfig = registerAs('authService', () => ({
  url: process.env.AUTH_SERVICE_URL || 'http://localhost:5173',
  timeout: parseInt(process.env.AUTH_SERVICE_TIMEOUT_MS || '5000', 10),
  // 게이트웨이에서 넘어온 API KEY를 사용하여 인증
  //apiKey: process.env.EVENT_TO_AUTH_API_KEY,
}));
