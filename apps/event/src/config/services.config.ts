import { registerAs } from '@nestjs/config';

// Auth 서비스 관련 설정
export const authServiceConfig = registerAs('authService', () => ({
  url: process.env.AUTH_SERVICE_URL || 'http://localhost:5173',
  timeout: parseInt(process.env.AUTH_SERVICE_TIMEOUT_MS || '5000', 10),
  apiKey: process.env.GATEWAY_INTERNAL_API_KEY, // 내부 통신이므로 신뢰한다고 간주.
}));
